import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export const REPORT_TARGET_TYPES = ['user', 'message', 'request', 'response', 'vendor'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export class CreateReportDto {
  @ApiProperty({ description: 'Tipo de contenido reportado', enum: REPORT_TARGET_TYPES })
  @IsString()
  @IsIn(REPORT_TARGET_TYPES as unknown as string[])
  targetType!: ReportTargetType;

  @ApiPropertyOptional({ description: 'ID del contenido reportado (mensaje, solicitud, etc.)' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'ID del usuario reportado (si aplica)' })
  @IsOptional()
  @IsString()
  reportedUserId?: string;

  @ApiProperty({ description: 'Motivo del reporte' })
  @IsString()
  @MaxLength(120)
  reason!: string;

  @ApiPropertyOptional({ description: 'Detalles adicionales' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
