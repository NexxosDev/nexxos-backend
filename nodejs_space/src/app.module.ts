import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';
import { VendorModule } from './vendor/vendor.module';
import { RequestsModule } from './requests/requests.module';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { IdentityModule } from './identity/identity.module';
import { PlansModule } from './plans/plans.module';
import { ClientPointsModule } from './client-points/client-points.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { LegalModule } from './legal/legal.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { AppConfigModule } from './app-config/app-config.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { CampaignModule } from './campaign/campaign.module';
import { PromoPopupModule } from './promo-popup/promo-popup.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SavedAddressModule } from './saved-address/saved-address.module';
import { UserVehicleModule } from './user-vehicle/user-vehicle.module';
import { PlacesModule } from './places/places.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    AppConfigModule,
    ExchangeRatesModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    RequestsModule,
    VendorModule,
    ChatModule,
    UploadModule,
    NotificationModule,
    IdentityModule,
    PlansModule,
    ClientPointsModule,
    VehiclesModule,
    LegalModule,
    SuggestionsModule,
    CampaignModule,
    PromoPopupModule,
    DeliveryModule,
    SavedAddressModule,
    UserVehicleModule,
    PlacesModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
