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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const crypto_1 = require("crypto");
let EmailVerificationService = class EmailVerificationService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async sendVerificationEmail(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('El correo ya está verificado');
        }
        await this.prisma.emailVerificationToken.deleteMany({
            where: { userId },
        });
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await this.prisma.emailVerificationToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
        await this.emailService.sendVerificationEmail(user.email, token, user.firstName);
    }
    async verifyEmail(token) {
        const verificationToken = await this.prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!verificationToken) {
            throw new common_1.BadRequestException('Token inválido');
        }
        if (verificationToken.expiresAt < new Date()) {
            throw new common_1.BadRequestException('El token ha expirado');
        }
        await this.prisma.user.update({
            where: { id: verificationToken.userId },
            data: { emailVerified: true },
        });
        await this.prisma.emailVerificationToken.delete({
            where: { token },
        });
    }
    async resendVerificationEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('El correo ya está verificado');
        }
        await this.sendVerificationEmail(user.id);
    }
};
exports.EmailVerificationService = EmailVerificationService;
exports.EmailVerificationService = EmailVerificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], EmailVerificationService);
//# sourceMappingURL=email-verification.service.js.map