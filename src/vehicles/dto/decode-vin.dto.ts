import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class DecodeVinDto {
  @ApiProperty({ example: '1HGBH41JXMN109186', description: 'VIN de 17 caracteres' })
  @IsString()
  @Length(17, 17, { message: 'El VIN debe tener exactamente 17 caracteres' })
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'El VIN contiene caracteres inválidos' })
  vin: string;
}
