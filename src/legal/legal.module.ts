import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LegalService } from './legal.service';
import { LegalApiController } from './legal-api.controller';
import { LegalHtmlController } from './legal.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LegalApiController, LegalHtmlController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
