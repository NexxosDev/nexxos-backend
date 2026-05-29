import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber } from 'class-validator';

export class SendMessageDto {
  @ApiProperty() @IsString() @IsNotEmpty() messageText: string;

  @ApiPropertyOptional({ enum: ['text', 'image', 'location', 'audio'], default: 'text' })
  @IsOptional() @IsString() @IsIn(['text', 'image', 'location', 'audio'])
  messageType?: string;

  @ApiPropertyOptional({ description: 'S3 image URL (required when messageType=image)' })
  @IsOptional() @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Latitude (required when messageType=location)' })
  @IsOptional() @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude (required when messageType=location)' })
  @IsOptional() @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Address text (optional when messageType=location)' })
  @IsOptional() @IsString()
  addressText?: string;

  @ApiPropertyOptional({ description: 'S3 audio URL (required when messageType=audio)' })
  @IsOptional() @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Audio duration in seconds' })
  @IsOptional() @IsNumber()
  audioDuration?: number;

  @ApiPropertyOptional({ description: 'ID of message being replied to' })
  @IsOptional() @IsString()
  replyToId?: string;
}
