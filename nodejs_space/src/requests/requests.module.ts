import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController, RequestsCronController } from './requests.controller';
import { VendorRequestsController } from './vendor-requests.controller';
import { PlansModule } from '../plans/plans.module';
import { ClientPointsModule } from '../client-points/client-points.module';

@Module({
  imports: [PlansModule, ClientPointsModule],
  controllers: [RequestsController, RequestsCronController, VendorRequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
