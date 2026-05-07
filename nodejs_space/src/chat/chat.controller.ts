import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat detail' })
  getChat(@CurrentUser('id') userId: string, @Param('chatId') chatId: string) {
    return this.chatService.getChatDetail(chatId, userId);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get chat messages (paginated)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'before', required: false })
  getMessages(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(chatId, userId, limit ? parseInt(limit) : undefined, before);
  }

  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Send a message in chat' })
  sendMessage(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(chatId, userId, dto.messageText, dto.messageType ?? 'text', dto.imageUrl, dto.replyToId);
  }
}
