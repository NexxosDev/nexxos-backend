import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');
    const emailHost = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');
    const emailPort = this.configService.get<number>('EMAIL_PORT', 587);

    if (!emailUser || !emailPassword) {
      this.logger.warn('Email credentials not configured. Email functionality will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.logger.log('Email transporter initialized successfully');
  }

  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return;
    }

    const appOrigin = this.configService.get<string>('APP_ORIGIN', 'http://localhost:3000');
    const verificationLink = `${appOrigin}verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Verifica tu correo electrónico - NEXXOS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: #121212; margin: 0; font-size: 28px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; background: #FFC107; color: #121212; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #FFD54F; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 NEXXOS</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${firstName}!</h2>
              <p>Gracias por registrarte en NEXXOS. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el botón de abajo:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verificar Correo Electrónico</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationLink}</p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expira en 24 horas.
              </div>
              
              <p>Si no creaste esta cuenta, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>© 2026 NEXXOS. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no respondas.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetLink: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping password reset email send.');
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Recupera tu contraseña - NEXXOS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { color: #121212; margin: 0; font-size: 28px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
            .button { display: inline-block; background: #FFC107; color: #121212; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .button:hover { background: #FFD54F; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 NEXXOS</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${firstName}!</h2>
              <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el botón de abajo para crear una nueva contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Restablecer Contraseña</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expira en 24 horas.
              </div>
              
              <p><strong>¿No solicitaste restablecer tu contraseña?</strong></p>
              <p>Si no fuiste tú, puedes ignorar este correo de forma segura. Tu contraseña no será cambiada.</p>
            </div>
            <div class="footer">
              <p>© 2026 NEXXOS. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no respondas.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }
}
