import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AvailabilityDto {
  @ApiProperty() @IsBoolean() isAvailable: boolean;
}
