import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../app-config/app-config.service';

const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const CURRENCY_PAIR = 'USD_VES';

@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService,
  ) {}

  /** Get latest exchange rate */
  async getLatest() {
    const row = await this.prisma.exchangeRate.findFirst({
      where: { currencyPair: CURRENCY_PAIR },
      orderBy: { date: 'desc' },
    });
    if (!row) return null;

    const ivaRateStr = await this.appConfigService.get('IVA_RATE');
    const ivaRate = parseFloat(ivaRateStr) || 16;

    return {
      rate: row.rate,
      date: row.date.toISOString().split('T')[0],
      source: row.source,
      currencyPair: row.currencyPair,
      ivaRate,
    };
  }

  /** Fetch rate from BCV API and save */
  async fetchFromBcv(): Promise<{ success: boolean; rate?: number; error?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(BCV_API_URL, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`BCV API responded ${res.status}`);
      }

      const data = await res.json() as { promedio?: number; fechaActualizacion?: string };
      const rate = data?.promedio;
      if (!rate || rate <= 0) {
        throw new Error('Invalid rate from BCV API');
      }

      // Parse date from API or use today
      const dateStr = data?.fechaActualizacion?.split('T')?.[0];
      const date = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

      // Upsert
      await this.prisma.exchangeRate.upsert({
        where: { currencyPair_date: { currencyPair: CURRENCY_PAIR, date } },
        update: { rate, source: 'BCV' },
        create: { currencyPair: CURRENCY_PAIR, rate, source: 'BCV', date },
      });

      this.logger.log(`BCV rate saved: ${rate} Bs/$ for ${date.toISOString().split('T')[0]}`);
      return { success: true, rate };
    } catch (err: any) {
      this.logger.error(`Failed to fetch BCV rate: ${err?.message ?? err}`);
      return { success: false, error: err?.message ?? 'Unknown error' };
    }
  }

  /** Set rate manually (admin) */
  async setManual(rate: number, dateStr?: string) {
    const date = dateStr
      ? new Date(dateStr + 'T00:00:00Z')
      : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');

    const row = await this.prisma.exchangeRate.upsert({
      where: { currencyPair_date: { currencyPair: CURRENCY_PAIR, date } },
      update: { rate, source: 'MANUAL' },
      create: { currencyPair: CURRENCY_PAIR, rate, source: 'MANUAL', date },
    });

    this.logger.log(`Manual rate set: ${rate} Bs/$ for ${date.toISOString().split('T')[0]}`);
    return row;
  }

  /** Get conversion data for a USD amount */
  async convertToVes(amountUsd: number) {
    const latest = await this.getLatest();
    if (!latest) return null;

    const subtotalBs = amountUsd * latest.rate;
    const ivaBs = subtotalBs * (latest.ivaRate / 100);
    const totalBs = subtotalBs + ivaBs;

    return {
      tasaBcv: latest.rate,
      fechaTasa: latest.date,
      source: latest.source,
      ivaRate: latest.ivaRate,
      subtotalBs: Math.round(subtotalBs * 100) / 100,
      ivaBs: Math.round(ivaBs * 100) / 100,
      totalBs: Math.round(totalBs * 100) / 100,
    };
  }
}
