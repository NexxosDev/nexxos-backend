import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
      // Ensure pg_trgm extension for fuzzy search
      try {
        await this.$queryRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      } catch (e) {
        this.logger.warn('Could not create pg_trgm extension (may already exist)');
      }
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
