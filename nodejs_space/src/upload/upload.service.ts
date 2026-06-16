import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generatePresignedUploadUrl, getFileUrl, fileExistsInS3, uploadBufferToS3 } from '../lib/s3';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPresignedUrl(userId: string, fileName: string, contentType: string, isPublic: boolean) {
    const result = await generatePresignedUploadUrl(fileName, contentType, isPublic);
    this.logger.log(`Presigned URL generated for user ${userId}: ${fileName}`);
    return result;
  }

  async completeUpload(userId: string, cloud_storage_path: string, fileName: string, contentType: string) {
    // Verify the file was actually uploaded to S3 before saving to DB
    const exists = await fileExistsInS3(cloud_storage_path);
    if (!exists) {
      this.logger.error(`File NOT found in S3 after upload: ${cloud_storage_path} (user: ${userId})`);
      throw new BadRequestException('El archivo no se pudo verificar en el servidor. Por favor intenta subir de nuevo.');
    }
    this.logger.log(`File verified in S3: ${cloud_storage_path}`);

    const isPublic = cloud_storage_path.includes('/public/');
    const file = await this.prisma.file.create({
      data: {
        userId,
        fileName,
        cloudStoragePath: cloud_storage_path,
        isPublic,
        contentType,
      },
    });
    const url = await getFileUrl(cloud_storage_path, isPublic);
    return { id: file.id, cloud_storage_path: file.cloudStoragePath, url };
  }

  /** Complete upload without saving to DB (for registration uploads before user exists) */
  async completeRegistrationUpload(cloud_storage_path: string, fileName: string, contentType: string) {
    const isPublic = cloud_storage_path.includes('/public/');
    const url = await getFileUrl(cloud_storage_path, isPublic);
    return { cloud_storage_path, url };
  }

  /**
   * Proxy upload: receives the file buffer, uploads directly to S3 from the server,
   * and saves the file record. Avoids presigned URL credential expiry issues.
   */
  async directUpload(userId: string, buffer: Buffer, fileName: string, contentType: string, isPublic: boolean) {
    const { cloud_storage_path, url } = await uploadBufferToS3(buffer, fileName, contentType, isPublic);
    this.logger.log(`Direct upload to S3 completed: ${cloud_storage_path} (${buffer.length} bytes, user: ${userId})`);

    const file = await this.prisma.file.create({
      data: {
        userId,
        fileName,
        cloudStoragePath: cloud_storage_path,
        isPublic,
        contentType,
      },
    });

    return { id: file.id, cloud_storage_path, url };
  }

  async getFileUrlById(fileId: string, mode: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    const url = await getFileUrl(file.cloudStoragePath, file.isPublic);
    return { url };
  }
}
