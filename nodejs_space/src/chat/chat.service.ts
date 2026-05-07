import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getChatDetail(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        request: {
          include: { vehicleBrand: true, vehicleModel: true, partCategory: true, partSubcategory: true },
        },
        vendor: { include: { user: { select: { firstName: true, lastName: true } } } },
        client: { select: { firstName: true, lastName: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    // Check access
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    const isClient = chat.clientId === userId;
    const isVendor = vendor?.id === chat.vendorId;
    if (!isClient && !isVendor) throw new ForbiddenException();

    const r = chat.request;
    const requestSummary = `${r.vehicleBrand.name} ${r.vehicleModel.name} - ${r.partCategory.name}${r.partSubcategory ? ' / ' + r.partSubcategory.name : ''}`;

    const otherUserName = isClient
      ? `${chat.vendor.user.firstName} ${chat.vendor.user.lastName}`
      : `${chat.client.firstName} ${chat.client.lastName}`;

    return {
      id: chat.id,
      requestId: chat.requestId,
      vendorId: chat.vendorId,
      vendorUserId: chat.vendor.userId,
      clientId: chat.clientId,
      requestSummary,
      otherUserName,
      createdAt: chat.createdAt.toISOString(),
    };
  }

  async getMessages(chatId: string, userId: string, limit = 50, before?: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    const isClient = chat.clientId === userId;
    const isVendor = vendor?.id === chat.vendorId;
    if (!isClient && !isVendor) throw new ForbiddenException();

    const where: any = { chatId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        replyTo: {
          select: {
            id: true,
            messageText: true,
            messageType: true,
            sender: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit);

    return {
      items: items.map((m: any) => ({
        id: m.id,
        senderId: m.sender.id,
        senderName: `${m.sender.firstName} ${m.sender.lastName}`,
        messageText: m.messageText,
        messageType: m.messageType ?? 'text',
        imageUrl: m.imageUrl ?? null,
        replyTo: m.replyTo ? {
          id: m.replyTo.id,
          messageText: m.replyTo.messageType === 'image' ? '📷 Imagen' : m.replyTo.messageText,
          senderName: `${m.replyTo.sender?.firstName ?? ''} ${m.replyTo.sender?.lastName ?? ''}`.trim(),
        } : null,
        createdAt: m.createdAt.toISOString(),
      })),
      hasMore,
    };
  }

  async sendMessage(chatId: string, userId: string, messageText: string, messageType = 'text', imageUrl?: string, replyToId?: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { vendor: { select: { userId: true } } },
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    const isClient = chat.clientId === userId;
    const isVendor = vendor?.id === chat.vendorId;
    if (!isClient && !isVendor) throw new ForbiddenException();

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId, senderId: userId, messageText, messageType,
        imageUrl: imageUrl ?? null,
        replyToId: replyToId ?? null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        replyTo: {
          select: {
            id: true,
            messageText: true,
            messageType: true,
            sender: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // 🔔 Push: Notificar al otro participante del chat
    const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
    const recipientUserId = isClient
      ? (chat as any).vendor?.userId
      : chat.clientId;
    if (recipientUserId) {
      const preview = messageType === 'image' ? '📷 Imagen' : (messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText);
      this.notificationService.sendToUser(
        recipientUserId,
        `💬 ${senderName}`,
        preview,
        { type: 'NEW_MESSAGE', chatId },
      ).catch((err) => this.logger.error('Push error (new message)', err));
    }

    const rt = (message as any).replyTo;
    return {
      id: message.id,
      senderId: message.sender.id,
      senderName,
      messageText: message.messageText,
      messageType: message.messageType,
      imageUrl: message.imageUrl,
      replyTo: rt ? {
        id: rt.id,
        messageText: rt.messageType === 'image' ? '📷 Imagen' : rt.messageText,
        senderName: `${rt.sender?.firstName ?? ''} ${rt.sender?.lastName ?? ''}`.trim(),
      } : null,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
