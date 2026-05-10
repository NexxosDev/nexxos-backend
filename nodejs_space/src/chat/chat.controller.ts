import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { MarkMessagesDto } from './dto/mark-messages.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('unread-summary')
  @ApiOperation({ summary: 'Get total unread message count and breakdown by requestId' })
  getUnreadSummary(@CurrentUser('id') userId: string) {
    return this.chatService.getUnreadSummary(userId);
  }

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

  @Patch(':chatId/messages/:messageId')
  @ApiOperation({ summary: 'Edit a sent message (own messages only, text only)' })
  editMessage(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.chatService.editMessage(chatId, messageId, userId, dto.messageText);
  }

  @Delete(':chatId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a sent message for everyone (own messages only, < 1 hour old)' })
  deleteMessage(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.deleteMessage(chatId, messageId, userId);
  }

  @Post(':chatId/messages/mark-delivered')
  @ApiOperation({ summary: 'Mark messages from the other user as delivered' })
  markDelivered(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: MarkMessagesDto,
  ) {
    return this.chatService.markDelivered(chatId, userId, dto.messageIds);
  }

  @Post(':chatId/messages/mark-read')
  @ApiOperation({ summary: 'Mark messages from the other user as read' })
  markRead(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Body() dto: MarkMessagesDto,
  ) {
    return this.chatService.markRead(chatId, userId, dto.messageIds);
  }
}
