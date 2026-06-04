import { Injectable, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Resend } from 'resend';
import { getConfig } from '../lib/config-helper';

@Injectable()
export class RegistrationCodeService {
  private readonly logger = new Logger(RegistrationCodeService.name);
  private resend: Resend | null = null;
  private lastResendKey = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private async ensureResend(): Promise<Resend | null> {
    const apiKey = await getConfig('API_RESEND_KEY', this.prisma);
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Registration code emails disabled.');
      return null;
    }
    if (this.resend && this.lastResendKey === apiKey) return this.resend;
    this.resend = new Resend(apiKey);
    this.lastResendKey = apiKey;
    this.logger.log('Resend email service initialized/refreshed');
    return this.resend;
  }

  async sendCode(email: string): Promise<{ success: boolean; expiresIn: number }> {
    const normalizedEmail = email?.trim()?.toLowerCase();
    if (!normalizedEmail) throw new BadRequestException('Email es requerido');

    // Check if email is already registered
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('Este correo electrónico ya está registrado.');
    }

    // Rate limit: max 5 codes per email in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await this.prisma.emailVerificationCode.count({
      where: { email: normalizedEmail, createdAt: { gte: oneHourAgo } },
    });
    if (recentCodes >= 5) {
      throw new BadRequestException('Demasiados intentos. Espera unos minutos antes de solicitar otro código.');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old codes for this email
    await this.prisma.emailVerificationCode.deleteMany({ where: { email: normalizedEmail } });

    // Save new code
    await this.prisma.emailVerificationCode.create({
      data: { email: normalizedEmail, code, expiresAt },
    });

    // Send email via Resend
    const resend = await this.ensureResend();
    if (resend) {
      try {
        const fromAddr = await getConfig('API_EMAIL_FROM', this.prisma) || 'NEXXOS <verificacion@nexxos.app>';
        await resend.emails.send({
          from: fromAddr,
          to: [normalizedEmail],
          subject: 'Tu código de verificación - NEXXOS',
          html: this.buildEmailHtml(code),
        });
        this.logger.log(`Verification code sent to ${normalizedEmail}`);
      } catch (err) {
        this.logger.error(`Failed to send code to ${normalizedEmail}:`, err);
        throw new BadRequestException('No se pudo enviar el correo. Verifica que el email sea válido.');
      }
    } else {
      this.logger.warn(`Resend not configured. Code for ${normalizedEmail}: ${code}`);
    }

    return { success: true, expiresIn: 300 };
  }

  async verifyCode(email: string, code: string): Promise<{ verified: boolean }> {
    const normalizedEmail = email?.trim()?.toLowerCase();
    if (!normalizedEmail || !code) throw new BadRequestException('Email y código son requeridos');

    const record = await this.prisma.emailVerificationCode.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('No se encontró un código de verificación. Solicita uno nuevo.');
    }

    if (record.attempts >= 5) {
      throw new BadRequestException('Demasiados intentos fallidos. Solicita un nuevo código.');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    if (record.code !== code.trim()) {
      await this.prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Código incorrecto. Intenta de nuevo.');
    }

    // Mark as verified
    await this.prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { verified: true },
    });

    this.logger.log(`Email ${normalizedEmail} verified successfully`);
    return { verified: true };
  }

  async isEmailVerified(email: string): Promise<boolean> {
    const normalizedEmail = email?.trim()?.toLowerCase();
    const record = await this.prisma.emailVerificationCode.findFirst({
      where: { email: normalizedEmail, verified: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return false;
    // Code must have been verified within the last 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    return record.createdAt >= thirtyMinAgo;
  }

  private buildEmailHtml(code: string): string {
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
            <h2>Código de Verificación</h2>
            <p>Tu código de verificación para registrarte en NEXXOS es:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 4px; white-space: nowrap; background: #F5F5F5; padding: 16px 28px; border-radius: 8px; border: 2px solid #FFC107; color: #121212;">${code}</span>
            </div>
            <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0;">
              <strong>Importante:</strong> Este código expira en <strong>5 minutos</strong>.
            </div>
            <p>Si no solicitaste este código, puedes ignorar este correo.</p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p>2026 NEXXOS. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
