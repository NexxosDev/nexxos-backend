import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AppConfigController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
