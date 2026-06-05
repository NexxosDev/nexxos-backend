import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generatePresignedUploadUrl, getFileUrl } from '../lib/s3';

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

  async getFileUrlById(fileId: string, mode: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    const url = await getFileUrl(file.cloudStoragePath, file.isPublic, this.prisma);
    return { url };
  }
}
