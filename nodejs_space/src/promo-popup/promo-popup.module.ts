import { Module } from '@nestjs/common';
import { PromoPopupController } from './promo-popup.controller';
import { PromoPopupService } from './promo-popup.service';
// PrismaModule es @Global(), por lo que PrismaService ya está inyectable aquí.

@Module({
  controllers: [PromoPopupController],
  providers: [PromoPopupService],
})
export class PromoPopupModule {}
