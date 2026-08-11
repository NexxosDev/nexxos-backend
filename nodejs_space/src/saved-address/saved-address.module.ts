import { Module } from '@nestjs/common';
import { SavedAddressService } from './saved-address.service';
import { SavedAddressController } from './saved-address.controller';

@Module({
  controllers: [SavedAddressController],
  providers: [SavedAddressService],
})
export class SavedAddressModule {}
