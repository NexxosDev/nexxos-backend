import { Controller, Get, Put, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppConfigService } from './app-config.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

const ALLOWED_KEYS = ['PLANS_MODE', 'PAYMENT_INFO', 'PAGO_MOVIL_INFO'];

@ApiTags('App Config')
@Controller('api')
export class AppConfigController {
  private readonly logger = new Logger(AppConfigController.name);

  constructor(private readonly configService: AppConfigService) {}

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
    return this.configService.set(dto.key, dto.value);
  }

  @Get('config/payment-info')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get payment info for plan purchases (authenticated users)' })
  async getPaymentInfo() {
    const [rawTransferencia, rawPagoMovil] = await Promise.all([
      this.configService.get('PAYMENT_INFO'),
      this.configService.get('PAGO_MOVIL_INFO'),
    ]);

    let transferencia: Record<string, unknown> | null = null;
    let pagoMovil: Record<string, unknown> | null = null;

    try { transferencia = JSON.parse(rawTransferencia); } catch { /* not configured */ }
    try { pagoMovil = JSON.parse(rawPagoMovil); } catch { /* not configured */ }

    return { transferencia, pagoMovil };
  }
}
