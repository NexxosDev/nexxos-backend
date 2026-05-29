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
var LegalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LegalService = LegalService_1 = class LegalService {
    prisma;
    logger = new common_1.Logger(LegalService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.legalDocument.findMany({
            select: { id: true, key: true, title: true, updatedAt: true },
            orderBy: { key: 'asc' },
        });
    }
    async findByKey(key) {
        const doc = await this.prisma.legalDocument.findUnique({ where: { key } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento legal '${key}' no encontrado`);
        return doc;
    }
    async update(key, content, title) {
        const existing = await this.prisma.legalDocument.findUnique({ where: { key } });
        if (!existing)
            throw new common_1.NotFoundException(`Documento legal '${key}' no encontrado`);
        const data = { content };
        if (title)
            data.title = title;
        const updated = await this.prisma.legalDocument.update({ where: { key }, data });
        this.logger.log(`Legal document '${key}' updated`);
        return updated;
    }
};
exports.LegalService = LegalService;
exports.LegalService = LegalService = LegalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LegalService);
//# sourceMappingURL=legal.service.js.map