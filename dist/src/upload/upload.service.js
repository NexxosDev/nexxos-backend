"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const s3_1 = require("../lib/s3");
let UploadService = UploadService_1 = class UploadService {
    prisma;
    logger = new common_1.Logger(UploadService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPresignedUrl(userId, fileName, contentType, isPublic) {
        const result = await (0, s3_1.generatePresignedUploadUrl)(fileName, contentType, isPublic);
        this.logger.log(`Presigned URL generated for user ${userId}: ${fileName}`);
        return result;
    }
    async completeUpload(userId, cloud_storage_path, fileName, contentType) {
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
        const url = await (0, s3_1.getFileUrl)(cloud_storage_path, isPublic);
        return { id: file.id, cloud_storage_path: file.cloudStoragePath, url };
    }
    async completeRegistrationUpload(cloud_storage_path, fileName, contentType) {
        const isPublic = cloud_storage_path.includes('/public/');
        const url = await (0, s3_1.getFileUrl)(cloud_storage_path, isPublic);
        return { cloud_storage_path, url };
    }
    async getFileUrlById(fileId, mode) {
        const file = await this.prisma.file.findUnique({ where: { id: fileId } });
        if (!file)
            throw new common_1.NotFoundException('File not found');
        const url = await (0, s3_1.getFileUrl)(file.cloudStoragePath, file.isPublic);
        return { url };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadService);
//# sourceMappingURL=upload.service.js.map