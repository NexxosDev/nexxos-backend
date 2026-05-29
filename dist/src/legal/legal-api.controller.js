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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LegalApiController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalApiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const legal_service_1 = require("./legal.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let LegalApiController = LegalApiController_1 = class LegalApiController {
    legalService;
    logger = new common_1.Logger(LegalApiController_1.name);
    constructor(legalService) {
        this.legalService = legalService;
    }
    async findAll() {
        return this.legalService.findAll();
    }
    async getFaq() {
        const doc = await this.legalService.findByKey('faq');
        try {
            const parsed = JSON.parse(doc?.content ?? '{}');
            return { id: doc?.id, title: doc?.title, updatedAt: doc?.updatedAt, ...parsed };
        }
        catch {
            return { id: doc?.id, title: doc?.title, updatedAt: doc?.updatedAt, categories: [] };
        }
    }
    async findByKey(key) {
        return this.legalService.findByKey(key);
    }
    async update(key, body) {
        this.logger.log(`Admin updating legal document: ${key}`);
        return this.legalService.update(key, body?.content, body?.title);
    }
};
exports.LegalApiController = LegalApiController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los documentos legales (sin contenido)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegalApiController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('faq'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener FAQ estructurado (JSON con categorías y preguntas)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegalApiController.prototype, "getFaq", null);
__decorate([
    (0, common_1.Get)(':key'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener documento legal por key (terminos, privacidad, sobre-nosotros, faq)' }),
    (0, swagger_1.ApiParam)({ name: 'key', enum: ['terminos', 'privacidad', 'sobre-nosotros', 'faq'] }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegalApiController.prototype, "findByKey", null);
__decorate([
    (0, common_1.Put)(':key'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar documento legal (solo ADMIN)' }),
    (0, swagger_1.ApiParam)({ name: 'key', enum: ['terminos', 'privacidad', 'sobre-nosotros', 'faq'] }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { content: { type: 'string' }, title: { type: 'string' } }, required: ['content'] } }),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LegalApiController.prototype, "update", null);
exports.LegalApiController = LegalApiController = LegalApiController_1 = __decorate([
    (0, swagger_1.ApiTags)('Legal'),
    (0, common_1.Controller)('api/legal'),
    __metadata("design:paramtypes", [legal_service_1.LegalService])
], LegalApiController);
//# sourceMappingURL=legal-api.controller.js.map