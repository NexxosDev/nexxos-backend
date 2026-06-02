import { Module } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [PrismaModule, AppConfigModule],
  controllers: [ExchangeRatesController],
  providers: [ExchangeRatesService],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
