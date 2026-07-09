import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CampaignService } from './campaign.service';
import { SendCampaignDto } from './dto/send-campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('api/admin/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({
    summary: 'Admin: enviar campaña push a usuarios segmentados por rol/plataforma',
  })
  async send(@Body() dto: SendCampaignDto) {
    return this.campaignService.send(dto);
  }
}
