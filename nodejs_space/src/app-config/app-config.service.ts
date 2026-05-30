import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Default values for app_config keys */
const DEFAULTS: Record<string, string> = {
  PLANS_MODE: 'free', // 'free' | 'production'
};

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Get a single config value (returns default if not in DB) */
  async get(key: string): Promise<string> {
    const row = await this.prisma.appConfig.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? '';
  }

  /** Set a single config value (upsert) */
  async set(key: string, value: string) {
    const row = await this.prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    this.logger.log(`Config updated: ${key} = ${value}`);
    return row;
  }

  /** Get all config entries */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.appConfig.findMany();
    const result: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }
}
