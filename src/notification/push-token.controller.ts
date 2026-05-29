import {
  Controller, Post, Delete, Body, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { RegisterTokenDto } from './dto/register-token.dto';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/push-tokens')
export class PushTokenController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Register Expo Push Token for current user' })
  async register(@Req() req: any, @Body() dto: RegisterTokenDto) {
    return this.notificationService.registerToken(req.user.id, dto.token, dto.platform);
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove push token (logout)' })
  async remove(@Body() body: { token: string }) {
    return this.notificationService.removeToken(body?.token ?? '');
  }
}
