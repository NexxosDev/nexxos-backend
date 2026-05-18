import {
  Controller, Post, Delete, Body, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChatPresenceService } from './chat-presence.service';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class SetPresenceDto {
  @ApiProperty({ description: 'The chat ID the user is currently viewing' })
  @IsString()
  @IsNotEmpty()
  chatId: string;
}

@ApiTags('Chat Presence')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/chat-presence')
export class ChatPresenceController {
  constructor(private readonly chatPresence: ChatPresenceService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Report that the user is actively viewing a chat (suppresses push notifications for that chat)' })
  async setActive(@Req() req: any, @Body() dto: SetPresenceDto) {
    this.chatPresence.setActive(req.user.id, dto.chatId);
    return { success: true };
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Clear active chat presence (re-enables push notifications)' })
  async clearActive(@Req() req: any) {
    this.chatPresence.clearActive(req.user.id);
    return { success: true };
  }
}
