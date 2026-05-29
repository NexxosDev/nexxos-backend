import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LegalService {
  private readonly logger = new Logger(LegalService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.legalDocument.findMany({
      select: { id: true, key: true, title: true, updatedAt: true },
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { key } });
    if (!doc) throw new NotFoundException(`Documento legal '${key}' no encontrado`);
    return doc;
  }

  async update(key: string, content: string, title?: string) {
    const existing = await this.prisma.legalDocument.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException(`Documento legal '${key}' no encontrado`);
    const data: any = { content };
    if (title) data.title = title;
    const updated = await this.prisma.legalDocument.update({ where: { key }, data });
    this.logger.log(`Legal document '${key}' updated`);
    return updated;
  }
}
