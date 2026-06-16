import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ChatPresenceService } from '../notification/chat-presence.service';
import { getFileUrl } from '../lib/s3';

const MESSAGE_SELECT = {
  id: true,
  senderId: true,
  messageText: true,
  messageType: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  addressText: true,
  audioUrl: true,
  audioDuration: true,
  status: true,
  isEdited: true,
  deletedForAll: true,
  createdAt: true,
  sender: { select: { id: true, firstName: true, lastName: true } },
  replyTo: {
    select: {
      id: true,
      senderId: true,
      messageText: true,
      messageType: true,
      deletedForAll: true,
      sender: { select: { firstName: true, lastName: true } },
    },
  },
};

function formatMessage(m: any, vendorUserId?: string, vendorBusinessName?: string) {
  if (!m) return null;
  const isDeleted = !!m.deletedForAll;
  const rt = m.replyTo;
  const replyToDeleted = rt?.deletedForAll;

  const personalName = `${m.sender?.firstName ?? ''} ${m.sender?.lastName ?? ''}`.trim();
  const senderId = m.sender?.id ?? m.senderId;
  const senderName = (vendorUserId && senderId === vendorUserId && vendorBusinessName)
    ? vendorBusinessName
    : personalName;

  let replySenderName = '';
  if (rt?.sender) {
    const replyPersonal = `${rt.sender?.firstName ?? ''} ${rt.sender?.lastName ?? ''}`.trim();
    replySenderName = (vendorUserId && rt.senderId === vendorUserId && vendorBusinessName)
      ? vendorBusinessName
      : replyPersonal;
  }

  return {
    id: m.id,
    senderId,
    senderName,
    messageText: isDeleted ? 'Mensaje eliminado' : (m.messageText ?? ''),
    messageType: isDeleted ? 'text' : (m.messageType ?? 'text'),
    imageUrl: isDeleted ? null : (m.imageUrl ?? null),
    latitude: isDeleted ? null : (m.latitude ?? null),
    longitude: isDeleted ? null : (m.longitude ?? null),
    addressText: isDeleted ? null : (m.addressText ?? null),
    audioUrl: isDeleted ? null : (m.audioUrl ?? null),
    audioDuration: isDeleted ? null : (m.audioDuration ?? null),
    status: m.status ?? 'sent',
    isEdited: m.isEdited ?? false,
    deletedForAll: isDeleted,
    replyTo: rt ? {
      id: rt.id,
      messageText: replyToDeleted ? 'Mensaje eliminado' : (rt.messageType === 'image' ? 'Imagen' : rt.messageType === 'audio' ? '🎤 Nota de voz' : rt.messageText),
      senderName: replySenderName,
    } : null,
    createdAt: m.createdAt?.toISOString?.() ?? '',
  };
}

/**
 * Extract S3 key from a stored URL or return as-is if already a storage path.
 * Handles:
 *  - Plain S3 keys (e.g. "37513/public/uploads/1718..." → not starting with http)
 *  - Full S3 URLs (e.g. "https://bucket.s3.region.amazonaws.com/key?signature...")
 *  - Signed URLs (e.g. "https://bucket.s3.region.amazonaws.com/key?X-Amz-...")
 */
function extractS3Key(value: string): string | null {
  if (!value) return null;
  // Already a storage path (not a URL)
  if (!value.startsWith('http')) return value;
  try {
    const url = new URL(value);
    // S3 URL pattern: https://bucket.s3.region.amazonaws.com/key
    if (url.hostname?.includes?.('.amazonaws.com')) {
      // pathname starts with / — remove leading slash
      const key = url.pathname?.substring?.(1);
      return key || null;
    }
  } catch { /* not a valid URL */ }
  return null; // non-S3 URL (e.g. external URL) — can't resolve
}

const DELETE_FOR_ALL_MAX_AGE_MS = 60 * 60 * 1000;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly chatPresence: ChatPresenceService,
  ) {}

  /**
   * Re-resolve a stored media URL (imageUrl / audioUrl) to a fresh signed URL.
   * Handles both old full S3 URLs and new cloud_storage_path values.
   */
  private async resolveMediaUrl(value: string | null): Promise<string | null> {
    if (!value) return null;
    const s3Key = extractS3Key(value);
    if (!s3Key) return value; // non-S3 URL, return as-is
    try {
      return await getFileUrl(s3Key, true, this.prisma);
    } catch (err) {
      this.logger.warn(`Failed to resolve media URL for key: ${s3Key}`, err);
      return value; // fallback to original
    }
  }

  /** Resolve imageUrl and audioUrl in a formatted message to fresh signed URLs */
  private async resolveMessageMedia(msg: any): Promise<any> {
    if (!msg) return msg;
    if (!msg.imageUrl && !msg.audioUrl) return msg;
    const [imageUrl, audioUrl] = await Promise.all([
      this.resolveMediaUrl(msg.imageUrl),
      this.resolveMediaUrl(msg.audioUrl),
    ]);
    return { ...msg, imageUrl, audioUrl };
  }

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

    const vendorBiz = await this.prisma.vendor.findUnique({ where: { id: chat.vendorId }, select: { businessName: true } });
    const otherUserName = isClient
      ? (vendorBiz?.businessName || `${chat.vendor.user.firstName} ${chat.vendor.user.lastName}`)
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
    const { chat } = await this.verifyAccess(chatId, userId);

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

    const vendorUserId = chat?.vendor?.userId;
    const vendorBusinessName = chat?.vendor?.businessName;

    const formatted = items.map((m: any) => formatMessage(m, vendorUserId, vendorBusinessName)).filter(Boolean);
    const resolved = await Promise.all(formatted.map((msg: any) => this.resolveMessageMedia(msg)));
    return { items: resolved, hasMore };
  }

  async sendMessage(chatId: string, userId: string, messageText: string, messageType = 'text', imageUrl?: string, replyToId?: string, latitude?: number, longitude?: number, addressText?: string, audioUrl?: string, audioDuration?: number) {
    const { chat, isClient, isVendor, vendorRecord } = await this.verifyAccess(chatId, userId);

    const now = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          chatId, senderId: userId, messageText, messageType,
          imageUrl: imageUrl ?? null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          addressText: addressText ?? null,
          audioUrl: audioUrl ?? null,
          audioDuration: audioDuration ?? null,
          replyToId: replyToId ?? null,
          status: 'sent',
        },
        select: MESSAGE_SELECT,
      }),
      this.prisma.request.update({
        where: { id: chat.requestId },
        data: { lastMessageAt: now },
      }),
    ]);

    const personalName = `${message.sender?.firstName ?? ''} ${message.sender?.lastName ?? ''}`.trim();
    const senderName = isVendor && vendorRecord?.businessName ? vendorRecord.businessName : (personalName || 'Usuario');
    const recipientUserId = isClient ? chat.vendor?.userId : chat.clientId;
    if (recipientUserId) {
      // Skip push if recipient is currently viewing this exact chat (WhatsApp-style)
      if (this.chatPresence.isUserInChat(recipientUserId, chatId)) {
        this.logger.debug(`Skipping push for user ${recipientUserId} — already viewing chat ${chatId}`);
      } else {
        const preview = messageType === 'image' ? 'Imagen' : messageType === 'location' ? '📍 Ubicación' : messageType === 'audio' ? '🎤 Nota de voz' : (messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText);
        this.notificationService.sendToUser(
          recipientUserId,
          senderName,
          preview,
          { type: 'NEW_MESSAGE', chatId },
        ).catch((err) => this.logger.error('Push error (new message)', err));
      }
    }

    const formatted = formatMessage(message, chat?.vendor?.userId, chat?.vendor?.businessName);
    return this.resolveMessageMedia(formatted);
  }

  async editMessage(chatId: string, messageId: string, userId: string, newText: string) {
    const { chat } = await this.verifyAccess(chatId, userId);

    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg || msg.chatId !== chatId) throw new NotFoundException('Message not found');
    if (msg.senderId !== userId) throw new ForbiddenException('Solo puedes editar tus propios mensajes');
    if (msg.deletedForAll) throw new BadRequestException('No se puede editar un mensaje eliminado');

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { messageText: newText, isEdited: true },
      select: MESSAGE_SELECT,
    });

    const formatted = formatMessage(updated, chat?.vendor?.userId, chat?.vendor?.businessName);
    return this.resolveMessageMedia(formatted);
  }

  async deleteMessage(chatId: string, messageId: string, userId: string) {
    const { chat } = await this.verifyAccess(chatId, userId);

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

    const fmtDel = formatMessage(updated, chat?.vendor?.userId, chat?.vendor?.businessName);
    return this.resolveMessageMedia(fmtDel);
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

    const chatIds = chats.map((c: any) => c.id);

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

    // Build requestId -> unreadCount and chatId -> unreadCount maps
    const chatToRequest = new Map<string, string>(chats.map((c: any) => [c.id, c.requestId]));
    const byRequestId: Record<string, number> = {};
    const byChatId: Record<string, number> = {};
    let totalUnread = 0;

    for (const entry of unreadCounts ?? []) {
      const count = (entry as any)?._count?.id ?? 0;
      if (count <= 0) continue;
      const chatId = String((entry as any).chatId ?? '');
      const requestId = chatToRequest.get(chatId) ?? '';
      if (requestId) {
        byRequestId[requestId] = (byRequestId[requestId] ?? 0) + count;
      }
      byChatId[chatId] = count;
      totalUnread += count;
    }

    return { totalUnread, byRequestId, byChatId };
  }
}
