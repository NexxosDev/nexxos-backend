import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('api/health')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString(), version: 'v2.2-banner-carousel' };
  }
}
