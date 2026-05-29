import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Root endpoint for Render health check' })
  getRoot() {
    return { status: 'ok', message: 'NEXXOS API is running' };
  }

  @Get('api/health')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
