import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpgradeToVendorDto } from './dto/upgrade-to-vendor.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('api')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user (CLIENTE or VENDEDOR)' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Post('auth/forgot-password')
  @ApiOperation({ summary: 'Send 6-digit password reset code to email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.passwordResetService.sendResetCode(dto.email);
    return {
      success: true,
      expiresIn: result.expiresIn,
      message: 'Si el email existe, recibirás un código de 6 dígitos para restablecer tu contraseña.',
    };
  }

  @Post('auth/verify-reset-code')
  @ApiOperation({ summary: 'Verify the 6-digit password reset code' })
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    const result = await this.passwordResetService.verifyResetCode(dto.email, dto.code);
    return { success: true, verified: result.verified };
  }

  @Post('auth/reset-password')
  @ApiOperation({ summary: 'Reset password using verified code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordResetService.resetPasswordWithCode(dto.email, dto.code, dto.newPassword);
    return {
      success: true,
      message: 'Contraseña restablecida exitosamente.',
    };
  }

  @Post('auth/upgrade-to-vendor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade existing client to vendor (creates vendor profile)' })
  upgradeToVendor(@CurrentUser('id') userId: string, @Body() dto: UpgradeToVendorDto) {
    return this.authService.upgradeToVendor(userId, dto);
  }
}
