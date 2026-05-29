import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayUnique, IsIn } from 'class-validator';

export const VALID_TAGS = [
  'FAVORITO',
  'MEJOR_PRECIO',
  'EN_NEGOCIACION',
  'TIENE_REPUESTO',
  'DESCARTADO',
] as const;

export type ResponseTagValue = (typeof VALID_TAGS)[number];

export class UpdateResponseTagsDto {
  @ApiProperty({
    description: 'List of tags to assign to this response (replaces existing)',
    example: ['FAVORITO', 'MEJOR_PRECIO'],
    enum: VALID_TAGS,
    isArray: true,
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(VALID_TAGS, { each: true })
  tags: string[];
}
