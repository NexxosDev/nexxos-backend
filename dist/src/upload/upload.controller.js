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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationUploadController = exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const presigned_dto_1 = require("./dto/presigned.dto");
const complete_upload_dto_1 = require("./dto/complete-upload.dto");
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    getPresigned(userId, dto) {
        return this.uploadService.getPresignedUrl(userId, dto.fileName, dto.contentType, dto.isPublic);
    }
    completeUpload(userId, dto) {
        return this.uploadService.completeUpload(userId, dto.cloud_storage_path, dto.fileName, dto.contentType);
    }
    getFileUrl(id, mode) {
        return this.uploadService.getFileUrlById(id, mode || 'view');
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('upload/presigned'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned URL for file upload' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, presigned_dto_1.PresignedDto]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "getPresigned", null);
__decorate([
    (0, common_1.Post)('upload/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm file upload completed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_upload_dto_1.CompleteUploadDto]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "completeUpload", null);
__decorate([
    (0, common_1.Get)('files/:id/url'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file URL' }),
    (0, swagger_1.ApiQuery)({ name: 'mode', required: false, enum: ['view', 'download'] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "getFileUrl", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
let RegistrationUploadController = class RegistrationUploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    getPresigned(dto) {
        return this.uploadService.getPresignedUrl('registration', dto.fileName, dto.contentType, dto.isPublic ?? true);
    }
    complete(dto) {
        return this.uploadService.completeRegistrationUpload(dto.cloud_storage_path, dto.fileName, dto.contentType);
    }
};
exports.RegistrationUploadController = RegistrationUploadController;
__decorate([
    (0, common_1.Post)('presigned'),
    (0, swagger_1.ApiOperation)({ summary: 'Get presigned URL for registration uploads (no auth)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [presigned_dto_1.PresignedDto]),
    __metadata("design:returntype", void 0)
], RegistrationUploadController.prototype, "getPresigned", null);
__decorate([
    (0, common_1.Post)('complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm registration file upload (no auth)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [complete_upload_dto_1.CompleteUploadDto]),
    __metadata("design:returntype", void 0)
], RegistrationUploadController.prototype, "complete", null);
exports.RegistrationUploadController = RegistrationUploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload'),
    (0, common_1.Controller)('api/upload/registration'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], RegistrationUploadController);
//# sourceMappingURL=upload.controller.js.map