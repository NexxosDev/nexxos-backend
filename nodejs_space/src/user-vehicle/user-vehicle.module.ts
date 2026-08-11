import { Module } from '@nestjs/common';
import { UserVehicleService } from './user-vehicle.service';
import { UserVehicleController } from './user-vehicle.controller';

@Module({
  controllers: [UserVehicleController],
  providers: [UserVehicleService],
})
export class UserVehicleModule {}
