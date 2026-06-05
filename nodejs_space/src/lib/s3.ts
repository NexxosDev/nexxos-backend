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
    ContentDisposition: isPublic ? 'attachment' : undefined,
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
    ContentDisposition: isPublic ? 'attachment' : undefined,
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
  if (isPublic) {
    const client = await createS3Client(prisma);
    const region = await client.config.region();
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: 'attachment',
  });
  const client = await createS3Client(prisma);
  return getSignedUrl(client, command, { expiresIn: 3600 });
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