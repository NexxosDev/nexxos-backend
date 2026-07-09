import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
// NotificationModule es @Global(), por lo que NotificationService ya está inyectable aquí.

@Module({
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}
