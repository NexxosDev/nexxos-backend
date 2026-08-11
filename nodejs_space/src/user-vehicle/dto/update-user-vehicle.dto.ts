import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsUUID, Min, Max, MaxLength } from 'class-validator';

export class UpdateUserVehicleDto {
  @ApiPropertyOptional({ description: 'ID de la marca (catálogo VehicleBrand)' })
  @IsOptional()
  @IsUUID()
  vehicleBrandId?: string;

  @ApiPropertyOptional({ description: 'ID del modelo (catálogo VehicleModel)' })
  @IsOptional()
  @IsUUID()
  vehicleModelId?: string;

  @ApiPropertyOptional({ description: 'Año del vehículo' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Apodo opcional' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  nickname?: string;

  @ApiPropertyOptional({ description: 'Marcar como vehículo favorito' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
