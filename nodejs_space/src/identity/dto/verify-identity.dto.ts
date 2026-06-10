import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyIdentityDto {
  @ApiProperty({ description: 'Base64-encoded personal ID document image (data:image/jpeg;base64,... or raw base64)' })
  @IsString() @IsNotEmpty()
  documentImageBase64: string;

  @ApiProperty({ description: 'Base64-encoded selfie neutral face (data:image/jpeg;base64,... or raw base64)' })
  @IsString() @IsNotEmpty()
  selfieNeutralBase64: string;

  @ApiProperty({ description: 'Base64-encoded selfie smiling (data:image/jpeg;base64,... or raw base64)' })
  @IsString() @IsNotEmpty()
  selfieSmileBase64: string;

  @ApiProperty({ description: 'Base64-encoded selfie head turned (data:image/jpeg;base64,... or raw base64)' })
  @IsString() @IsNotEmpty()
  selfieTurnBase64: string;
}
