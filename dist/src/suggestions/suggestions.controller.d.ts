import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
export declare class SuggestionsController {
    private readonly suggestionsService;
    constructor(suggestionsService: SuggestionsService);
    create(userId: string, dto: CreateSuggestionDto): Promise<{
        success: boolean;
    }>;
}
