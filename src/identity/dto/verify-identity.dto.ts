import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyIdentityDto {
  @ApiProperty({ description: 'Public URL of the personal ID document image' })
  @IsString() @IsNotEmpty()
  documentImageUrl: string;

  @ApiProperty({ description: 'Public URL of the selfie (neutral face)' })
  @IsString() @IsNotEmpty()
  selfieNeutralUrl: string;

  @ApiProperty({ description: 'Public URL of the selfie (smiling)' })
  @IsString() @IsNotEmpty()
  selfieSmileUrl: string;

  @ApiProperty({ description: 'Public URL of the selfie (head turned)' })
  @IsString() @IsNotEmpty()
  selfieTurnUrl: string;
}
