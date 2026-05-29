import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';

@ApiTags('Suggestions')
@Controller('api/suggestions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a catalog suggestion' })
  @ApiBody({ type: CreateSuggestionDto })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSuggestionDto,
  ) {
    return this.suggestionsService.createSuggestion(dto.text, userId);
  }
}
