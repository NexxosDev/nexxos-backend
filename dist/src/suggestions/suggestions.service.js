"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SuggestionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SuggestionsService = SuggestionsService_1 = class SuggestionsService {
    prisma;
    logger = new common_1.Logger(SuggestionsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSuggestion(text, userId) {
        const normalizedText = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
        this.logger.log(`New catalog suggestion from user ${userId}: "${normalizedText}"`);
        await this.prisma.catalogSuggestion.create({
            data: {
                text: text.trim(),
                normalizedText,
                userId,
            },
        });
        return { success: true };
    }
};
exports.SuggestionsService = SuggestionsService;
exports.SuggestionsService = SuggestionsService = SuggestionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuggestionsService);
//# sourceMappingURL=suggestions.service.js.map