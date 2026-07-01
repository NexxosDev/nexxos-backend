import { Controller, Get, Put, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppConfigService } from './app-config.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { getConfig } from '../lib/config-helper';
import { PrismaService } from '../prisma/prisma.service';

class UpdateConfigDto {
  @ApiProperty({ example: 'PLANS_MODE' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'free', description: 'Config value. For PLANS_MODE: "free" or "production"' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

const ALLOWED_KEYS = ['PLANS_MODE', 'PAYMENT_INFO', 'PAGO_MOVIL_INFO', 'ZELLE_INFO', 'PAYMENT_METHODS', 'EXCHANGE_RATE_MODE', 'IVA_RATE', 'MARKETING_BANNER', 'MARKETING_CLIENT_BANNER'];

@ApiTags('App Config')
@Controller('api')
export class AppConfigController {
  private readonly logger = new Logger(AppConfigController.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('admin/config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Get all app configuration' })
  async getAll() {
    return this.configService.getAll();
  }

  @Put('admin/config')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Update a config value' })
  async update(@Body() dto: UpdateConfigDto) {
    if (!ALLOWED_KEYS.includes(dto.key)) {
      return { error: `Key '${dto.key}' no es configurable` };
    }
    if (dto.key === 'PLANS_MODE' && !['free', 'production'].includes(dto.value)) {
      return { error: 'PLANS_MODE debe ser "free" o "production"' };
    }
    if (dto.key === 'EXCHANGE_RATE_MODE' && !['auto', 'manual'].includes(dto.value)) {
      return { error: 'EXCHANGE_RATE_MODE debe ser "auto" o "manual"' };
    }
    if (dto.key === 'IVA_RATE') {
      const num = parseFloat(dto.value);
      if (isNaN(num) || num < 0 || num > 100) {
        return { error: 'IVA_RATE debe ser un número entre 0 y 100' };
      }
    }
    return this.configService.set(dto.key, dto.value);
  }

  @Get('config/payment-info')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get active payment methods for plan purchases (authenticated users)' })
  async getPaymentInfo() {
    // Read each payment method key from app_config (set by admin panel)
    const METHOD_KEYS: { configKey: string; methodKey: string; label: string; icon: string }[] = [
      { configKey: 'PAYMENT_INFO', methodKey: 'transferencia', label: 'Transferencia Bancaria', icon: 'business-outline' },
      { configKey: 'PAGO_MOVIL_INFO', methodKey: 'pagoMovil', label: 'Pago Móvil', icon: 'phone-portrait-outline' },
      { configKey: 'ZELLE_INFO', methodKey: 'zelle', label: 'Zelle', icon: 'card-outline' },
    ];

    const rawValues = await Promise.all(
      METHOD_KEYS.map((m) => this.configService.get(m.configKey)),
    );

    const activeMethods: Record<string, unknown> = {};

    for (let i = 0; i < METHOD_KEYS.length; i++) {
      const raw = rawValues[i];
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        // Only include methods where activo === true
        if (parsed?.activo === true) {
          // Build a normalized response with fields map for the frontend
          const { activo, concepto, contactoWhatsApp, contactoEmail, instrucciones, ...fields } = parsed as any;
          activeMethods[METHOD_KEYS[i].methodKey] = {
            isActive: true,
            label: METHOD_KEYS[i].label,
            icon: METHOD_KEYS[i].icon,
            fields,
            concepto: concepto ?? '',
            contactoWhatsApp: contactoWhatsApp ?? '',
            contactoEmail: contactoEmail ?? '',
            instrucciones: instrucciones ?? '',
          };
        }
      } catch {
        this.logger.warn(`Failed to parse ${METHOD_KEYS[i].configKey}`);
      }
    }

    return { methods: activeMethods };
  }

  /**
   * Parses a stored banner JSON string and returns a normalized carousel response.
   * Supports the new multi-slide shape ({ slides: [...] }) and the legacy
   * single-image shape ({ imageUrl, linkUrl, altText }). Respects `activo` and
   * the fechaInicio/fechaFin scheduling window.
   */
  private buildBannerResponse(raw: string | null | undefined, keyLabel: string) {
    if (!raw) return { visible: false, banners: [], slides: [] };

    try {
      const parsed = JSON.parse(raw) as {
        activo?: boolean;
        imageUrl?: string;
        linkUrl?: string;
        altText?: string;
        fechaInicio?: string;
        fechaFin?: string;
        slides?: Array<{ imageUrl?: string; linkUrl?: string; altText?: string }>;
      };

      if (!parsed?.activo) {
        return { visible: false, banners: [], slides: [] };
      }

      // Scheduling window
      const now = new Date();
      if (parsed.fechaInicio) {
        const start = new Date(parsed.fechaInicio);
        if (!isNaN(start.getTime()) && now < start) {
          return { visible: false, banners: [], slides: [] };
        }
      }
      if (parsed.fechaFin) {
        const end = new Date(parsed.fechaFin + 'T23:59:59');
        if (!isNaN(end.getTime()) && now > end) {
          return { visible: false, banners: [], slides: [] };
        }
      }

      // Build the ordered slides array. Prefer `slides`; fall back to the
      // legacy single top-level image for banners saved before carousels.
      const source =
        Array.isArray(parsed.slides) && parsed.slides.length > 0
          ? parsed.slides
          : parsed.imageUrl
          ? [{ imageUrl: parsed.imageUrl, linkUrl: parsed.linkUrl, altText: parsed.altText }]
          : [];

      const slides = source
        .filter((s) => s && typeof s.imageUrl === 'string' && s.imageUrl.length > 0)
        .slice(0, 4)
        .map((s) => ({
          imageUrl: s.imageUrl as string,
          linkUrl: s.linkUrl ?? '',
          altText: s.altText ?? '',
        }));

      if (slides.length === 0) {
        return { visible: false, banners: [], slides: [] };
      }

      const first = slides[0];
      return {
        visible: true,
        // New carousel arrays (both names for max frontend compatibility)
        banners: slides,
        slides,
        // Legacy single-image fields (first slide)
        imageUrl: first.imageUrl,
        linkUrl: first.linkUrl,
        altText: first.altText,
      };
    } catch {
      this.logger.warn(`Failed to parse ${keyLabel} config`);
      return { visible: false, banners: [], slides: [] };
    }
  }

  @Get('marketing/banner')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get active marketing banner carousel (if any)' })
  async getMarketingBanner() {
    const raw = await this.configService.get('MARKETING_BANNER');
    return this.buildBannerResponse(raw, 'MARKETING_BANNER');
  }

  @Get('config/public-keys')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get public API keys for client apps (Google Maps, etc.)' })
  async getPublicKeys() {
    const googleMapsKey = await getConfig('API_GOOGLE_MAPS_KEY', this.prisma);
    return {
      googleMapsKey: googleMapsKey || '',
    };
  }

  @Get('marketing/client-banner')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get active marketing banner carousel for client home screen (if any)' })
  async getClientBanner() {
    const raw = await this.configService.get('MARKETING_CLIENT_BANNER');
    const res = this.buildBannerResponse(raw, 'MARKETING_CLIENT_BANNER');
    // Also expose `banner` (first slide) for parity with the admin public endpoint.
    return {
      ...res,
      banner: res.visible && res.banners.length > 0 ? res.banners[0] : null,
    };
  }
}
