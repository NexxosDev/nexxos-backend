import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Por seguridad, no revelamos si el email existe o no
    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return; // Retornamos sin error para no revelar si el email existe
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Eliminar tokens antiguos del usuario
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Crear nuevo token
    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    // Obtener APP_ORIGIN del ConfigService
    const appOrigin = this.configService.get<string>('APP_ORIGIN') ?? '';
    const resetLink = `${appOrigin}reset-password?token=${token}`;

    // Enviar email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.firstName ?? 'Usuario', resetLink);
      this.logger.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      // No lanzamos error para no revelar si el email existe
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new BadRequestException('Token expirado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Eliminar el token usado
    await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    this.logger.log(`Password reset successfully for user: ${resetToken.user.email}`);
  }
}
