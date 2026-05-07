import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class SendMessageDto {
  @ApiProperty() @IsString() @IsNotEmpty() messageText: string;

  @ApiPropertyOptional({ enum: ['text', 'image'], default: 'text' })
  @IsOptional() @IsString() @IsIn(['text', 'image'])
  messageType?: string;

  @ApiPropertyOptional({ description: 'S3 image URL (required when messageType=image)' })
  @IsOptional() @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'ID of message being replied to' })
  @IsOptional() @IsString()
  replyToId?: string;
}
