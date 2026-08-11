import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class DeliveryEnabledDto {
  @ApiProperty() @IsBoolean() deliveryEnabled: boolean;
}
