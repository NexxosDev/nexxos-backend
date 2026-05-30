import { Controller, Get, Put, Body, UseGuards, Logger } from '@nestjs/common';
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

@ApiTags('App Config')
@Controller('api/admin/config')
export class AppConfigController {
  private readonly logger = new Logger(AppConfigController.name);

  constructor(private readonly configService: AppConfigService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Get all app configuration' })
  async getAll() {
    return this.configService.getAll();
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Update a config value' })
  async update(@Body() dto: UpdateConfigDto) {
    const allowed = ['PLANS_MODE'];
    if (!allowed.includes(dto.key)) {
      return { error: `Key '${dto.key}' no es configurable` };
    }
    if (dto.key === 'PLANS_MODE' && !['free', 'production'].includes(dto.value)) {
      return { error: 'PLANS_MODE debe ser "free" o "production"' };
    }
    return this.configService.set(dto.key, dto.value);
  }
}
