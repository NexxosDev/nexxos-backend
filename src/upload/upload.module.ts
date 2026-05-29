import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController, RegistrationUploadController } from './upload.controller';

@Module({
  controllers: [UploadController, RegistrationUploadController],
  providers: [UploadService],
})
export class UploadModule {}
