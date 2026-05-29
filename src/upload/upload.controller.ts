import { Controller, Post, Get, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PresignedDto } from './dto/presigned.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload/presigned')
  @ApiOperation({ summary: 'Get presigned URL for file upload' })
  getPresigned(@CurrentUser('id') userId: string, @Body() dto: PresignedDto) {
    return this.uploadService.getPresignedUrl(userId, dto.fileName, dto.contentType, dto.isPublic);
  }

  @Post('upload/complete')
  @ApiOperation({ summary: 'Confirm file upload completed' })
  completeUpload(@CurrentUser('id') userId: string, @Body() dto: CompleteUploadDto) {
    return this.uploadService.completeUpload(userId, dto.cloud_storage_path, dto.fileName, dto.contentType);
  }

  @Get('files/:id/url')
  @ApiOperation({ summary: 'Get file URL' })
  @ApiQuery({ name: 'mode', required: false, enum: ['view', 'download'] })
  getFileUrl(@Param('id') id: string, @Query('mode') mode?: string) {
    return this.uploadService.getFileUrlById(id, mode || 'view');
  }
}

/** Public upload endpoints for registration (no auth) */
@ApiTags('Upload')
@Controller('api/upload/registration')
export class RegistrationUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned')
  @ApiOperation({ summary: 'Get presigned URL for registration uploads (no auth)' })
  getPresigned(@Body() dto: PresignedDto) {
    return this.uploadService.getPresignedUrl('registration', dto.fileName, dto.contentType, dto.isPublic ?? true);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Confirm registration file upload (no auth)' })
  complete(@Body() dto: CompleteUploadDto) {
    return this.uploadService.completeRegistrationUpload(dto.cloud_storage_path, dto.fileName, dto.contentType);
  }
}
