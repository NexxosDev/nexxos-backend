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

const ALLOWED_KEYS = ['PLANS_MODE', 'PAYMENT_INFO', 'PAGO_MOVIL_INFO', 'PAYMENT_METHODS'];

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
  @ApiOperation({ summary: 'Get active payment methods for plan purchases (authenticated users)' })
  async getPaymentInfo() {
    const raw = await this.configService.get('PAYMENT_METHODS');
    try {
      const allMethods = JSON.parse(raw) as Record<string, { isActive?: boolean; [k: string]: unknown }>;
      // Filter to only active methods
      const activeMethods: Record<string, unknown> = {};
      for (const [key, method] of Object.entries(allMethods ?? {})) {
        if (method?.isActive) {
          activeMethods[key] = method;
        }
      }
      return { methods: activeMethods };
    } catch {
      return { methods: {} };
    }
  }
}
