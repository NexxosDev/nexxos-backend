import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { RegistrationCodeService } from './registration-code.service';

class SendCodeDto {
  @IsEmail() email: string;
}

class VerifyCodeDto {
  @IsEmail() email: string;
  @IsNotEmpty() @IsString() code: string;
}

@ApiTags('Auth')
@Controller('api/auth')
export class RegistrationCodeController {
  constructor(private readonly registrationCodeService: RegistrationCodeService) {}

  @Post('send-code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send 6-digit verification code to email (pre-registration)' })
  async sendCode(@Body() dto: SendCodeDto) {
    return this.registrationCodeService.sendCode(dto.email);
  }

  @Post('verify-code')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify the 6-digit code for email' })
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.registrationCodeService.verifyCode(dto.email, dto.code);
  }
}
