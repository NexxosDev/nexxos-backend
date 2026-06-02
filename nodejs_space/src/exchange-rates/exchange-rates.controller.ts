import { Controller, Get, Post, Put, Body, UseGuards, HttpCode, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExchangeRatesService } from './exchange-rates.service';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

class SetManualRateDto {
  @ApiProperty({ example: 61.56 })
  @IsNumber()
  @Min(0.01)
  rate: number;

  @ApiProperty({ example: '2026-06-02', required: false })
  @IsString()
  @IsOptional()
  date?: string;
}

@ApiTags('Exchange Rates')
@Controller('api')
export class ExchangeRatesController {
  private readonly logger = new Logger(ExchangeRatesController.name);

  constructor(private readonly service: ExchangeRatesService) {}

  @Get('exchange-rates/latest')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get latest USD/VES exchange rate + IVA rate' })
  async getLatest() {
    const data = await this.service.getLatest();
    if (!data) return { available: false, message: 'Tasa no disponible' };
    return { available: true, ...data };
  }

  @Post('exchange-rates/fetch-bcv')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cron/Admin: Fetch latest BCV rate from API' })
  async fetchBcv() {
    return this.service.fetchFromBcv();
  }

  @Put('admin/exchange-rates')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Set exchange rate manually' })
  async setManual(@Body() dto: SetManualRateDto) {
    return this.service.setManual(dto.rate, dto.date);
  }
}
