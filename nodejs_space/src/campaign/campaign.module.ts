import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CronGuard } from './cron.guard';
// NotificationModule es @Global(), por lo que NotificationService ya está inyectable aquí.
// ConfigModule es global, por lo que ConfigService (usado por CronGuard) también.

@Module({
  controllers: [CampaignController],
  providers: [CampaignService, CronGuard],
})
export class CampaignModule {}
