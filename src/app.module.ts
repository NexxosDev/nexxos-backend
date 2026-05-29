import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}
