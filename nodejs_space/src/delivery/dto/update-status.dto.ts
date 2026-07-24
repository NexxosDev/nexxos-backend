import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ description: 'Nuevo estado del envío', enum: ['IN_TRANSIT', 'DELIVERED'] })
  @IsString()
  @IsIn(['IN_TRANSIT', 'DELIVERED'])
  status!: string;
}
