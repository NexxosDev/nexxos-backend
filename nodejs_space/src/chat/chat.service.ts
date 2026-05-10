import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  messageText: true,
  messageType: true,
  imageUrl: true,
  status: true,
  isEdited: true,
  deletedForAll: true,
  createdAt: true,
  sender: { select: { id: true, firstName: true, lastName: true } },
  replyTo: {
    select: {
      id: true,
      messageText: true,
      messageType: true,
      deletedForAll: true,
      sender: { select: { firstName: true, lastName: true } },
    },
  },
};

function formatMessage(m: any) {
  if (!m) return null;
  const isDeleted = !!m.deletedForAll;
  const rt = m.replyTo;
  const replyToDeleted = rt?.deletedForAll;
  return {
    id: m.id,
    senderId: m.sender?.id ?? m.senderId,
    senderName: `${m.sender?.firstName ?? ''} ${m.sender?.lastName ?? ''}`.trim(),
    messageText: isDeleted ? 'Mensaje eliminado' : (m.messageText ?? ''),
    messageType: isDeleted ? 'text' : (m.messageType ?? 'text'),
    imageUrl: isDeleted ? null : (m.imageUrl ?? null),
    status: m.status ?? 'sent',
    isEdited: m.isEdited ?? false,
    deletedForAll: isDeleted,
    replyTo: rt ? {
      id: rt.id,
      messageText: replyToDeleted ? 'Mensaje eliminado' : (rt.messageType === 'image' ? 'Imagen' : rt.messageText),
      senderName: `${rt.sender?.firstName ?? ''} ${rt.sender?.lastName ?? ''}`.trim(),
    } : null,
    createdAt: m.createdAt?.toISOString?.() ?? '',
  };
}

const DELETE_FOR_ALL_MAX_AGE_MS = 60 * 60 * 1000;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async verifyAccess(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: { vendor: { select: { id: true, userId: true, businessName: true } } },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    const vendorRecord = await this.prisma.vendor.findUnique({ where: { userId } });
    const isClient = chat.clientId === userId;
    const isVendor = vendorRecord?.id === chat.vendorId;
    if (!isClient && !isVendor) throw new ForbiddenException();
    return { chat, isClient, isVendor, vendorRecord };
  }

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

    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    const isClient = chat.clientId === userId;
    const isVendor = vendor?.id === chat.vendorId;
    if (!isClient && !isVendor) throw new ForbiddenException();

    const r = chat.request;
    const requestSummary = `${r.vehicleBrand.name} ${r.vehicleModel.name} - ${r.partCategory.name}${r.partSubcategory ? ' / ' + r.partSubcategory.name : ''}`;

    const otherUserName = isClient
      ? `${chat.vendor.user.firstName} ${chat.vendor.user.lastName}`
      : `${chat.client.firstName} ${chat.client.lastName}`;

    const unreadCount = await this.prisma.chatMessage.count({
      where: {
        chatId,
        senderId: { not: userId },
        status: { not: 'read' },
        deletedForAll: false,
      },
    });

    return {
      id: chat.id,
      requestId: chat.requestId,
      vendorId: chat.vendorId,
      vendorUserId: chat.vendor.userId,
      clientId: chat.clientId,
      requestSummary,
      otherUserName,
      unreadCount,
      createdAt: chat.createdAt.toISOString(),
    };
  }

  async getMessages(chatId: string, userId: string, limit = 50, before?: string) {
    await this.verifyAccess(chatId, userId);

    const where: any = { chatId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      select: MESSAGE_SELECT,
    });

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit);

    return {
      items: items.map(formatMessage).filter(Boolean),
      hasMore,
    };
  }

  async sendMessage(chatId: string, userId: string, messageText: string, messageType = 'text', imageUrl?: string, replyToId?: string) {
    const { chat, isClient, isVendor, vendorRecord } = await this.verifyAccess(chatId, userId);

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId, senderId: userId, messageText, messageType,
        imageUrl: imageUrl ?? null,
        replyToId: replyToId ?? null,
        status: 'sent',
      },
      select: MESSAGE_SELECT,
    });

    const personalName = `${message.sender?.firstName ?? ''} ${message.sender?.lastName ?? ''}`.trim();
    const senderName = isVendor && vendorRecord?.businessName ? vendorRecord.businessName : (personalName || 'Usuario');
    const recipientUserId = isClient ? chat.vendor?.userId : chat.clientId;
    if (recipientUserId) {
      const preview = messageType === 'image' ? 'Imagen' : (messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText);
      this.notificationService.sendToUser(
        recipientUserId,
        senderName,
        preview,
        { type: 'NEW_MESSAGE', chatId },
      ).catch((err) => this.logger.error('Push error (new message)', err));
    }

    return formatMessage(message);
  }

  async editMessage(chatId: string, messageId: string, userId: string, newText: string) {
    await this.verifyAccess(chatId, userId);

    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.chatId !== chatId) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Solo puedes editar tus propios mensajes');
    if (msg.deletedForAll) throw new BadRequestException('No se puede editar un mensaje eliminado');

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { messageText: newText, isEdited: true },
      select: MESSAGE_SELECT,
    });

    return formatMessage(updated);
  }

  async deleteMessage(chatId: string, messageId: string, userId: string) {
    await this.verifyAccess(chatId, userId);

    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.chatId !== chatId) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    if (msg.deletedForAll) throw new BadRequestException('El mensaje ya fue eliminado');

    const ageMs = Date.now() - new Date(msg.createdAt).getTime();
    if (ageMs > DELETE_FOR_ALL_MAX_AGE_MS) {
      throw new BadRequestException('Solo puedes eliminar mensajes con menos de 1 hora de antiguedad');
    }

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedForAll: true },
      select: MESSAGE_SELECT,
    });

    return formatMessage(updated);
  }

  async markDelivered(chatId: string, userId: string, messageIds?: string[]) {
    await this.verifyAccess(chatId, userId);

    const where: any = {
      chatId,
      senderId: { not: userId },
      status: 'sent',
      deletedForAll: false,
    };
    if (messageIds?.length) {
      where.id = { in: messageIds };
    }

    const result = await this.prisma.chatMessage.updateMany({
      where,
      data: { status: 'delivered' },
    });

    return { updated: result.count };
  }

  async markRead(chatId: string, userId: string, messageIds?: string[]) {
    await this.verifyAccess(chatId, userId);

    const where: any = {
      chatId,
      senderId: { not: userId },
      status: { in: ['sent', 'delivered'] },
      deletedForAll: false,
    };
    if (messageIds?.length) {
      where.id = { in: messageIds };
    }

    const result = await this.prisma.chatMessage.updateMany({
      where,
      data: { status: 'read' },
    });

    return { updated: result.count };
  }

  async getUnreadSummary(userId: string) {
    // Find all chats this user participates in
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });

    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { clientId: userId },
          ...(vendor ? [{ vendorId: vendor.id }] : []),
        ],
      },
      select: { id: true, requestId: true },
    });

    if (!chats?.length) {
      return { totalUnread: 0, byRequestId: {} };
    }

    const chatIds = chats.map((c) => c.id);

    // Count unread messages per chat (messages NOT sent by this user, not read, not deleted)
    const unreadCounts = await this.prisma.chatMessage.groupBy({
      by: ['chatId'],
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId },
        status: { not: 'read' },
        deletedForAll: false,
      },
      _count: { id: true },
    });

    // Build requestId -> unreadCount map
    const chatToRequest = new Map(chats.map((c) => [c.id, c.requestId]));
    const byRequestId: Record<string, number> = {};
    let totalUnread = 0;

    for (const entry of unreadCounts ?? []) {
      const count = entry?._count?.id ?? 0;
      const requestId = chatToRequest.get(entry.chatId) ?? '';
      if (requestId && count > 0) {
        byRequestId[requestId] = (byRequestId[requestId] ?? 0) + count;
        totalUnread += count;
      }
    }

    return { totalUnread, byRequestId };
  }
}
