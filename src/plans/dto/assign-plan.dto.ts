import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AssignPlanDto {
  @ApiProperty({ description: 'Plan slug to assign (beta, gratuito, pro, premium)' })
  @IsString() @IsNotEmpty()
  planSlug: string;

  @ApiProperty({ description: 'Months until expiration (null = indefinite)', required: false })
  @IsOptional()
  expirationMonths?: number;
}
