import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CampaignService } from './campaign.service';
import { SendCampaignDto } from './dto/send-campaign.dto';
import { CronGuard } from './cron.guard';

@ApiTags('Campaigns')
@Controller('api/admin/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Admin: enviar campaña push a usuarios segmentados por rol/plataforma',
  })
  async send(@Body() dto: SendCampaignDto) {
    return this.campaignService.send(dto);
  }

  @Post('process-scheduled')
  @HttpCode(200)
  @UseGuards(CronGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Cron: procesa campañas SCHEDULED cuya hora ya llegó (Authorization: Bearer <CRON_SECRET>)',
  })
  async processScheduled() {
    return this.campaignService.processScheduled();
  }
}
