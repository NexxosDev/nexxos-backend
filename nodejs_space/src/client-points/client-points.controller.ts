import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientPointsService } from './client-points.service';

@ApiTags('Client Points')
@Controller('api/client')
export class ClientPointsController {
  constructor(private readonly pointsService: ClientPointsService) {}

  @Get('points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get client points summary (total, level, progress, history)' })
  async getPoints(@Request() req: any) {
    return this.pointsService.getClientPointsSummary(req.user?.id);
  }

  @Post('rating-reminders')
  @ApiOperation({ summary: 'Send push reminders for unrated closed requests (cron)' })
  async sendRatingReminders() {
    return this.pointsService.sendRatingReminders();
  }
}
