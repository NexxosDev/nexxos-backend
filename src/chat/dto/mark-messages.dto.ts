import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class MarkMessagesDto {
  @ApiPropertyOptional({ description: 'Optional array of message IDs to mark. If empty, marks all unread messages.', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messageIds?: string[];
}
