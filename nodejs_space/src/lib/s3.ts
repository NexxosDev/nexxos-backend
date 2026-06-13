import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

/** Check if content type should be served inline (images, video, audio — not SVG) */
function shouldServeInline(contentType: string): boolean {
  return (contentType.startsWith('image/') && contentType !== 'image/svg+xml')
    || contentType.startsWith('video/')
    || contentType.startsWith('audio/');
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

  // CRITICAL: Do NOT set ContentDisposition during upload — it bakes 'attachment'
  // into S3 object metadata and prevents inline rendering (images show blank on Android)
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

  // CRITICAL: Do NOT set ContentDisposition during upload
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

export async function getFileUrl(
  cloud_storage_path: string,
  isPublic: boolean,
  prisma?: any,
  contentType?: string,
): Promise<string> {
  const { bucketName } = await getBucketConfig(prisma);
  const client = await createS3Client(prisma);

  // Determine disposition based on content type
  const ct = contentType ?? guessContentType(cloud_storage_path);
  const disposition = shouldServeInline(ct) ? 'inline' : 'attachment';

  // Always use signed URLs to override any stored Content-Disposition metadata
  // (existing S3 objects may have 'attachment' baked in from the old upload bug)
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: disposition,
  });

  // Public files: long expiry (7 days); private files: short expiry (1 hour)
  const expiresIn = isPublic ? 604800 : 3600;
  return getSignedUrl(client, command, { expiresIn });
}

/** Guess content type from file extension */
function guessContentType(path: string): string {
  const ext = path?.split('.')?.pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', mp4: 'video/mp4', mp3: 'audio/mpeg',
    m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg', pdf: 'application/pdf',
  };
  return map[ext] ?? 'application/octet-stream';
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