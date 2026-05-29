import { UploadService } from './upload.service';
import { PresignedDto } from './dto/presigned.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    getPresigned(userId: string, dto: PresignedDto): Promise<{
        uploadUrl: string;
        cloud_storage_path: string;
    }>;
    completeUpload(userId: string, dto: CompleteUploadDto): Promise<{
        id: string;
        cloud_storage_path: string;
        url: string;
    }>;
    getFileUrl(id: string, mode?: string): Promise<{
        url: string;
    }>;
}
export declare class RegistrationUploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    getPresigned(dto: PresignedDto): Promise<{
        uploadUrl: string;
        cloud_storage_path: string;
    }>;
    complete(dto: CompleteUploadDto): Promise<{
        cloud_storage_path: string;
        url: string;
    }>;
}
