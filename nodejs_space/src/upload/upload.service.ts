import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generatePresignedUploadUrl, getFileUrl, fileExistsInS3, uploadBufferToS3 } from '../lib/s3';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPresignedUrl(userId: string, fileName: string, contentType: string, isPublic: boolean) {
    const result = await generatePresignedUploadUrl(fileName, contentType, isPublic, this.prisma);
    this.logger.log(`Presigned URL generated for user ${userId}: ${fileName}`);
    return result;
  }

  async completeUpload(userId: string, cloud_storage_path: string, fileName: string, contentType: string) {
    // Verify the file was actually uploaded to S3 before saving to DB
    const exists = await fileExistsInS3(cloud_storage_path, this.prisma);
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
    const url = await getFileUrl(cloud_storage_path, isPublic, this.prisma);
    return { id: file.id, cloud_storage_path: file.cloudStoragePath, url };
  }

  /** Complete upload without saving to DB (for registration uploads before user exists) */
  async completeRegistrationUpload(cloud_storage_path: string, fileName: string, contentType: string) {
    const isPublic = cloud_storage_path.includes('/public/');
    const url = await getFileUrl(cloud_storage_path, isPublic, this.prisma);
    return { cloud_storage_path, url };
  }

  /**
   * Proxy upload: receives the file buffer, uploads directly to S3 from the server,
   * and saves the file record. Avoids presigned URL credential expiry issues.
   */
  async directUpload(userId: string, buffer: Buffer, fileName: string, contentType: string, isPublic: boolean) {
    try {
      this.logger.log(`Direct upload starting: ${fileName} (${buffer.length} bytes, user: ${userId}, public: ${isPublic})`);
      const { cloud_storage_path, url } = await uploadBufferToS3(buffer, fileName, contentType, isPublic, this.prisma);
      this.logger.log(`Direct upload to S3 completed: ${cloud_storage_path}`);

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
    } catch (err: any) {
      this.logger.error(`Direct upload FAILED: ${err?.message ?? err}`, err?.stack);
      throw err;
    }
  }

  async getFileUrlById(fileId: string, mode: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    const url = await getFileUrl(file.cloudStoragePath, file.isPublic, this.prisma);
    return { url };
  }
}
