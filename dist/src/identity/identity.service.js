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
var IdentityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let IdentityService = IdentityService_1 = class IdentityService {
    prisma;
    config;
    logger = new common_1.Logger(IdentityService_1.name);
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async verifyIdentity(documentImageUrl, selfieNeutralUrl, selfieSmileUrl, selfieTurnUrl) {
        const apiKey = this.config.get('ABACUSAI_API_KEY');
        if (!apiKey)
            throw new common_1.BadRequestException('LLM API not configured');
        const livenessResult = await this.callLLM(apiKey, [
            {
                role: 'user',
                content: [
                    { type: 'text', text: `Analiza estas 3 fotos de selfie tomadas en secuencia. Verifica:\n1. Las 3 fotos muestran a la MISMA persona\n2. Foto 1: rostro neutro mirando de frente\n3. Foto 2: la persona está SONRIENDO (expresión diferente a foto 1)\n4. Foto 3: la persona giró la cabeza hacia un lado (pose diferente a foto 1)\n\nEsto es una prueba de vida (liveness). Si las 3 fotos son idénticas o parecen una foto estática repetida, falla la prueba.\n\nResponde SOLO con JSON válido:\n{"liveness": true/false, "reason": "explicación breve"}` },
                    { type: 'image_url', image_url: { url: selfieNeutralUrl } },
                    { type: 'image_url', image_url: { url: selfieSmileUrl } },
                    { type: 'image_url', image_url: { url: selfieTurnUrl } },
                ],
            },
        ]);
        this.logger.log(`Liveness result: ${JSON.stringify(livenessResult)}`);
        if (!livenessResult?.liveness) {
            return {
                match: false,
                liveness: false,
                confidence: 'n/a',
                reason: livenessResult?.reason ?? 'No se pudo verificar la prueba de vida. Las fotos no muestran las acciones solicitadas.',
            };
        }
        const matchResult = await this.callLLM(apiKey, [
            {
                role: 'user',
                content: [
                    { type: 'text', text: `Compara estas 2 imágenes:\n- Imagen 1: Un documento de identidad (cédula venezolana u otro documento oficial con foto)\n- Imagen 2: Un selfie de una persona\n\n¿La persona del selfie es la MISMA persona que aparece en la foto del documento de identidad?\n\nConsidera que la foto del documento puede ser más antigua, con diferente iluminación, ángulo, o la persona puede tener cambios menores (pelo, barba, lentes).\n\nResponde SOLO con JSON válido:\n{"match": true/false, "confidence": "alta"/"media"/"baja", "reason": "explicación breve"}` },
                    { type: 'image_url', image_url: { url: documentImageUrl } },
                    { type: 'image_url', image_url: { url: selfieNeutralUrl } },
                ],
            },
        ]);
        this.logger.log(`Match result: ${JSON.stringify(matchResult)}`);
        const isMatch = !!matchResult?.match;
        return {
            match: isMatch,
            liveness: true,
            confidence: matchResult?.confidence ?? 'baja',
            reason: matchResult?.reason ?? 'No se pudo determinar.',
        };
    }
    async callLLM(apiKey, messages) {
        try {
            const res = await fetch('https://apps.abacus.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    messages,
                    response_format: { type: 'json_object' },
                    stream: false,
                }),
            });
            if (!res.ok) {
                const errText = await res.text();
                this.logger.error(`LLM API error: ${res.status} ${errText}`);
                throw new Error(`LLM API returned ${res.status}`);
            }
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content ?? '{}';
            return JSON.parse(content);
        }
        catch (err) {
            this.logger.error('LLM call failed', err);
            throw new common_1.BadRequestException('Error al verificar identidad. Intenta de nuevo.');
        }
    }
};
exports.IdentityService = IdentityService;
exports.IdentityService = IdentityService = IdentityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], IdentityService);
//# sourceMappingURL=identity.service.js.map