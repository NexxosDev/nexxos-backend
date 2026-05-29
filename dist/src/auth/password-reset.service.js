"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PasswordResetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const resend_1 = require("resend");
const bcrypt = __importStar(require("bcryptjs"));
let PasswordResetService = PasswordResetService_1 = class PasswordResetService {
    prisma;
    configService;
    logger = new common_1.Logger(PasswordResetService_1.name);
    resend = null;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        const apiKey = this.configService.get('RESEND_API_KEY');
        if (apiKey) {
            this.resend = new resend_1.Resend(apiKey);
            this.logger.log('Resend initialized for password reset');
        }
        else {
            this.logger.warn('RESEND_API_KEY not configured. Password reset emails disabled.');
        }
    }
    async sendResetCode(email) {
        const normalizedEmail = email?.trim()?.toLowerCase();
        if (!normalizedEmail)
            throw new common_1.BadRequestException('Email es requerido');
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            this.logger.warn(`Password reset requested for non-existent email: ${normalizedEmail}`);
            return { success: true, expiresIn: 300 };
        }
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCodes = await this.prisma.passwordResetCode.count({
            where: { email: normalizedEmail, createdAt: { gte: oneHourAgo } },
        });
        if (recentCodes >= 5) {
            throw new common_1.BadRequestException('Demasiados intentos. Espera unos minutos antes de solicitar otro código.');
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await this.prisma.passwordResetCode.deleteMany({ where: { email: normalizedEmail } });
        await this.prisma.passwordResetCode.create({
            data: { email: normalizedEmail, code, expiresAt },
        });
        if (this.resend) {
            try {
                await this.resend.emails.send({
                    from: 'NEXXOS <verificacion@nexxos.app>',
                    to: [normalizedEmail],
                    subject: 'Código de recuperación de contraseña - NEXXOS',
                    html: this.buildEmailHtml(code, user.firstName ?? 'Usuario'),
                });
                this.logger.log(`Password reset code sent to ${normalizedEmail}`);
            }
            catch (err) {
                this.logger.error(`Failed to send reset code to ${normalizedEmail}:`, err);
                throw new common_1.BadRequestException('No se pudo enviar el correo. Intenta de nuevo.');
            }
        }
        else {
            this.logger.warn(`Resend not configured. Reset code for ${normalizedEmail}: ${code}`);
        }
        return { success: true, expiresIn: 300 };
    }
    async verifyResetCode(email, code) {
        const normalizedEmail = email?.trim()?.toLowerCase();
        if (!normalizedEmail || !code)
            throw new common_1.BadRequestException('Email y código son requeridos');
        const record = await this.prisma.passwordResetCode.findFirst({
            where: { email: normalizedEmail },
            orderBy: { createdAt: 'desc' },
        });
        if (!record) {
            throw new common_1.BadRequestException('No se encontró un código de recuperación. Solicita uno nuevo.');
        }
        if (record.attempts >= 5) {
            throw new common_1.BadRequestException('Demasiados intentos fallidos. Solicita un nuevo código.');
        }
        if (record.expiresAt < new Date()) {
            throw new common_1.BadRequestException('El código ha expirado. Solicita uno nuevo.');
        }
        if (record.code !== code.trim()) {
            await this.prisma.passwordResetCode.update({
                where: { id: record.id },
                data: { attempts: { increment: 1 } },
            });
            throw new common_1.BadRequestException('Código incorrecto. Intenta de nuevo.');
        }
        await this.prisma.passwordResetCode.update({
            where: { id: record.id },
            data: { verified: true },
        });
        this.logger.log(`Password reset code verified for ${normalizedEmail}`);
        return { verified: true };
    }
    async resetPasswordWithCode(email, code, newPassword) {
        const normalizedEmail = email?.trim()?.toLowerCase();
        if (!normalizedEmail || !code || !newPassword) {
            throw new common_1.BadRequestException('Email, código y nueva contraseña son requeridos');
        }
        if (newPassword.length < 6) {
            throw new common_1.BadRequestException('La contraseña debe tener al menos 6 caracteres');
        }
        const record = await this.prisma.passwordResetCode.findFirst({
            where: { email: normalizedEmail, verified: true },
            orderBy: { createdAt: 'desc' },
        });
        if (!record) {
            throw new common_1.BadRequestException('Código no verificado. Verifica tu código primero.');
        }
        if (record.code !== code.trim()) {
            throw new common_1.BadRequestException('Código inválido.');
        }
        const tenMinutesAfterCreation = new Date(record.createdAt.getTime() + 10 * 60 * 1000);
        if (tenMinutesAfterCreation < new Date()) {
            throw new common_1.BadRequestException('La sesión ha expirado. Solicita un nuevo código.');
        }
        const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            throw new common_1.BadRequestException('Usuario no encontrado.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await this.prisma.passwordResetCode.deleteMany({ where: { email: normalizedEmail } });
        this.logger.log(`Password reset successfully for user: ${normalizedEmail}`);
    }
    buildEmailHtml(code, firstName) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #121212; margin: 0; font-size: 28px;">NEXXOS</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Recuperar Contraseña</h2>
            <p>Hola <strong>${firstName}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 4px; white-space: nowrap; background: #F5F5F5; padding: 16px 28px; border-radius: 8px; border: 2px solid #FFC107; color: #121212;">${code}</span>
            </div>
            <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0;">
              <strong>Importante:</strong> Este código expira en <strong>5 minutos</strong>.
            </div>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>2026 NEXXOS. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
};
exports.PasswordResetService = PasswordResetService;
exports.PasswordResetService = PasswordResetService = PasswordResetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PasswordResetService);
//# sourceMappingURL=password-reset.service.js.map