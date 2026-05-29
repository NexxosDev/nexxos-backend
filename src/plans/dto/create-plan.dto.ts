import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro' }) @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional({ example: 'pro' }) @IsOptional() @IsString() slug?: string;
  @ApiPropertyOptional({ example: 'Plan Pro con mayor capacidad' }) @IsOptional() @IsString() @Transform(({ value }) => value === '' ? undefined : value) description?: string;
  @ApiPropertyOptional({ example: 500 }) @IsOptional() @IsInt() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) solicitudesMensuales?: number;
  @ApiPropertyOptional({ example: 3 }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) prioridad?: number;
  @ApiPropertyOptional({ example: 19.99 }) @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) precioMensual?: number;
  @ApiPropertyOptional({ example: 199.99 }) @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) precioAnual?: number;
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) comisionPorcentaje?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() visibleEnApp?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() isActive?: boolean;

  // ── Legacy fields from admin panel v1 ──
  @ApiPropertyOptional({ example: 9.99, description: 'Legacy: maps to precioMensual' }) @IsOptional() @IsNumber() @Type(() => Number) @Transform(({ value }) => (value === '' || value == null) ? undefined : value) price?: number;
  @ApiPropertyOptional({ example: 'monthly', description: 'Legacy: billing cycle' }) @IsOptional() @IsString() @Transform(({ value }) => value === '' ? undefined : value) billingCycle?: string;
}
