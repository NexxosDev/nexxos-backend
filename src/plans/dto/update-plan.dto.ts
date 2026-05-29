import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdatePlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => value === '' ? undefined : value) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) solicitudesMensuales?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) prioridad?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) precioMensual?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) precioAnual?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) comisionPorcentaje?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() visibleEnApp?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;

  // ── Legacy fields from admin panel v1 ──
  @ApiPropertyOptional({ description: 'Legacy: maps to precioMensual' }) @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) price?: number;
  @ApiPropertyOptional({ description: 'Legacy: billing cycle' }) @IsOptional() @IsString() @Transform(({ value }) => value === '' ? undefined : value) billingCycle?: string;
}
