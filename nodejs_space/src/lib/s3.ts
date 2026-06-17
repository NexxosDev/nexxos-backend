import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig, invalidateCachedCredentials } from './aws-config';
import { Logger } from '@nestjs/common';

const s3Logger = new Logger('S3');

/**
 * Upload a buffer directly to S3 (proxy upload — avoids presigned URL credential expiry).
 * Includes automatic credential refresh retry on InvalidAccessKeyId.
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  isPublic = false,
  prisma?: any,
): Promise<{ cloud_storage_path: string; url: string }> {
  const { bucketName, folderPrefix } = await getBucketConfig(prisma);
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;

  const putCmd = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    Body: buffer,
    ContentType: contentType,
  });

  // Try upload, with one retry on credential failure
  let client = await createS3Client(prisma);
  try {
    await client.send(putCmd);
  } catch (err: any) {
    if (err?.Code === 'InvalidAccessKeyId' || err?.name === 'InvalidAccessKeyId') {
      s3Logger.warn(`S3 upload got InvalidAccessKeyId, refreshing credentials and retrying...`);
      invalidateCachedCredentials();
      client = await createS3Client(prisma);
      await client.send(putCmd);
      s3Logger.log('Retry with refreshed credentials succeeded');
    } else {
      throw err;
    }
  }

  // Build direct URL for public files
  const region = typeof client.config.region === 'function'
    ? await client.config.region()
    : (client.config.region ?? 'us-west-2');
  const url = `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;

  return { cloud_storage_path, url };
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false,
  prisma?: any,
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const { bucketName, folderPrefix } = await getBucketConfig(prisma);
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
  });

  const client = await createS3Client(prisma);
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { uploadUrl, cloud_storage_path };
}

export async function initiateMultipartUpload(
  fileName: string,
  isPublic: boolean,
  prisma?: any,
): Promise<{ uploadId: string; cloud_storage_path: string }> {
  const { bucketName, folderPrefix } = await getBucketConfig(prisma);
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  const client = await createS3Client(prisma);
  const response = await client.send(command);
  return { uploadId: response.UploadId!, cloud_storage_path };
}

export async function getPresignedUrlForPart(
  cloud_storage_path: string,
  uploadId: string,
  partNumber: number,
  prisma?: any,
): Promise<string> {
  const { bucketName } = await getBucketConfig(prisma);
  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  const client = await createS3Client(prisma);
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function completeMultipartUpload(
  cloud_storage_path: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
  prisma?: any,
) {
  const { bucketName } = await getBucketConfig(prisma);
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  const client = await createS3Client(prisma);
  await client.send(command);
}

export async function getFileUrl(cloud_storage_path: string, isPublic: boolean, prisma?: any): Promise<string> {
  const { bucketName } = await getBucketConfig(prisma);
  const client = await createS3Client(prisma);
  if (isPublic) {
    const region = typeof client.config.region === 'function'
      ? await client.config.region()
      : (client.config.region ?? 'us-west-2');
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: 'attachment',
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/**
 * Generate a signed GET URL for a media file (image / audio).
 * Accepts either a bare S3 key  ("37513/public/uploads/…")
 * or a full S3 URL            ("https://bucket.s3.region.amazonaws.com/37513/…").
 * Always returns a signed URL so the file is accessible regardless of bucket ACL.
 */
export async function getSignedMediaUrl(pathOrUrl: string, prisma?: any): Promise<string> {
  if (!pathOrUrl) return '';

  const { bucketName } = await getBucketConfig(prisma);
  const client = await createS3Client(prisma);

  // Extract the S3 key
  let key = pathOrUrl;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const url = new URL(pathOrUrl);
      key = decodeURIComponent(url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname);
    } catch {
      return pathOrUrl; // unparseable — return as-is
    }
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    // No ResponseContentDisposition — let the browser/app decide (images render inline by default)
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

/** Check if a file exists in S3 (returns true/false, never throws) */
export async function fileExistsInS3(cloud_storage_path: string, prisma?: any): Promise<boolean> {
  try {
    const { bucketName } = await getBucketConfig(prisma);
    const client = await createS3Client(prisma);
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: cloud_storage_path }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(cloud_storage_path: string, prisma?: any) {
  const { bucketName } = await getBucketConfig(prisma);
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });
  const client = await createS3Client(prisma);
  await client.send(command);
}