import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestionDto {
  @ApiProperty({
    description: 'Suggestion text - brand, model or part the user wants to find',
    example: 'Filtro de aceite para Toyota Corolla 2020',
  })
  @IsString()
  @IsNotEmpty({ message: 'El texto de la sugerencia es requerido' })
  @MaxLength(500, { message: 'La sugerencia no puede exceder 500 caracteres' })
  text: string;
}
