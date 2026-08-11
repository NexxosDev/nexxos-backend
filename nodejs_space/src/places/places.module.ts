import { Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { PlacesPublicController } from './places-public.controller';

@Module({
  controllers: [PlacesController, PlacesPublicController],
  providers: [PlacesService],
})
export class PlacesModule {}
