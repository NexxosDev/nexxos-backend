import { IsString, IsNotEmpty, MaxLength, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateQuickReplyDto {
  @ApiProperty({ example: 'Sí, lo tengo disponible' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  messageText: string;
}

export class UpdateQuickReplyDto {
  @ApiPropertyOptional({ example: 'Sí, lo tengo disponible' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  messageText?: string;
}

class ReorderItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsInt()
  order: number;
}

export class ReorderQuickRepliesDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
