import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo ya está verificado');
    }

    // Delete any existing tokens for this user
    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Generate a new token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Save the token
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    // Send the email
    await this.emailService.sendVerificationEmail(user.email, token, user.firstName);
  }

  async verifyEmail(token: string): Promise<void> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Token inválido');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('El token ha expirado');
    }

    // Mark email as verified
    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete the token
    await this.prisma.emailVerificationToken.delete({
      where: { token },
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo ya está verificado');
    }

    await this.sendVerificationEmail(user.id);
  }
}
