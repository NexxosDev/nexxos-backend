import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSuggestion(text: string, userId: string) {
    const normalizedText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    this.logger.log(`New catalog suggestion from user ${userId}: "${normalizedText}"`);

    await this.prisma.catalogSuggestion.create({
      data: {
        text: text.trim(),
        normalizedText,
        userId,
      },
    });

    return { success: true };
  }
}
