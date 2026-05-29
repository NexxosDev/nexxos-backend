import { Controller, Post, Get, Query, Body, BadRequestException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth')
export class EmailVerificationController {
  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token es requerido');
    }

    await this.emailVerificationService.verifyEmail(token);

    return {
      success: true,
      message: 'Correo electrónico verificado exitosamente',
    };
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email es requerido');
    }

    await this.emailVerificationService.resendVerificationEmail(email);

    return {
      success: true,
      message: 'Correo de verificación enviado',
    };
  }
}
