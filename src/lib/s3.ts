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

let _s3Client: ReturnType<typeof createS3Client> | null = null;

function getS3Client() {
  if (!_s3Client) {
    _s3Client = createS3Client();
  }
  return _s3Client;
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false,
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
  return { uploadUrl, cloud_storage_path };
}

export async function initiateMultipartUpload(
  fileName: string,
  isPublic: boolean,
): Promise<{ uploadId: string; cloud_storage_path: string }> {
  const { bucketName, folderPrefix } = getBucketConfig();
  const prefix = isPublic ? `${folderPrefix}public/uploads` : `${folderPrefix}uploads`;
  const cloud_storage_path = `${prefix}/${Date.now()}-${fileName}`;

  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentDisposition: isPublic ? 'attachment' : undefined,
  });

  const response = await getS3Client().send(command);
  return { uploadId: response.UploadId!, cloud_storage_path };
}

export async function getPresignedUrlForPart(
  cloud_storage_path: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  const { bucketName } = getBucketConfig();
  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export async function completeMultipartUpload(
  cloud_storage_path: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[],
) {
  const { bucketName } = getBucketConfig();
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  await getS3Client().send(command);
}

export async function getFileUrl(cloud_storage_path: string, isPublic: boolean): Promise<string> {
  const { bucketName } = getBucketConfig();
  if (isPublic) {
    const region = await getS3Client().config.region();
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: 'attachment',
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string) {
  const { bucketName } = getBucketConfig();
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });
  await getS3Client().send(command);
}
