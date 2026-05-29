"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const chat_presence_service_1 = require("../notification/chat-presence.service");
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
function formatMessage(m, vendorUserId, vendorBusinessName) {
    if (!m)
        return null;
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
const DELETE_FOR_ALL_MAX_AGE_MS = 60 * 60 * 1000;
let ChatService = ChatService_1 = class ChatService {
    prisma;
    notificationService;
    chatPresence;
    logger = new common_1.Logger(ChatService_1.name);
    constructor(prisma, notificationService, chatPresence) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.chatPresence = chatPresence;
    }
    async verifyAccess(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: { vendor: { select: { id: true, userId: true, businessName: true } } },
        });
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        const vendorRecord = await this.prisma.vendor.findUnique({ where: { userId } });
        const isClient = chat.clientId === userId;
        const isVendor = vendorRecord?.id === chat.vendorId;
        if (!isClient && !isVendor)
            throw new common_1.ForbiddenException();
        return { chat, isClient, isVendor, vendorRecord };
    }
    async getChatDetail(chatId, userId) {
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
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
        const isClient = chat.clientId === userId;
        const isVendor = vendor?.id === chat.vendorId;
        if (!isClient && !isVendor)
            throw new common_1.ForbiddenException();
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
    async getMessages(chatId, userId, limit = 50, before) {
        const { chat } = await this.verifyAccess(chatId, userId);
        const where = { chatId };
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
        return {
            items: items.map((m) => formatMessage(m, vendorUserId, vendorBusinessName)).filter(Boolean),
            hasMore,
        };
    }
    async sendMessage(chatId, userId, messageText, messageType = 'text', imageUrl, replyToId, latitude, longitude, addressText, audioUrl, audioDuration) {
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
            if (this.chatPresence.isUserInChat(recipientUserId, chatId)) {
                this.logger.debug(`Skipping push for user ${recipientUserId} — already viewing chat ${chatId}`);
            }
            else {
                const preview = messageType === 'image' ? 'Imagen' : messageType === 'location' ? '📍 Ubicación' : messageType === 'audio' ? '🎤 Nota de voz' : (messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText);
                this.notificationService.sendToUser(recipientUserId, senderName, preview, { type: 'NEW_MESSAGE', chatId }).catch((err) => this.logger.error('Push error (new message)', err));
            }
        }
        return formatMessage(message, chat?.vendor?.userId, chat?.vendor?.businessName);
    }
    async editMessage(chatId, messageId, userId, newText) {
        const { chat } = await this.verifyAccess(chatId, userId);
        const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (!msg || msg.chatId !== chatId)
            throw new common_1.NotFoundException('Message not found');
        if (msg.senderId !== userId)
            throw new common_1.ForbiddenException('Solo puedes editar tus propios mensajes');
        if (msg.deletedForAll)
            throw new common_1.BadRequestException('No se puede editar un mensaje eliminado');
        const updated = await this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { messageText: newText, isEdited: true },
            select: MESSAGE_SELECT,
        });
        return formatMessage(updated, chat?.vendor?.userId, chat?.vendor?.businessName);
    }
    async deleteMessage(chatId, messageId, userId) {
        const { chat } = await this.verifyAccess(chatId, userId);
        const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (!msg || msg.chatId !== chatId)
            throw new common_1.NotFoundException('Message not found');
        if (msg.senderId !== userId)
            throw new common_1.ForbiddenException('Solo puedes eliminar tus propios mensajes');
        if (msg.deletedForAll)
            throw new common_1.BadRequestException('El mensaje ya fue eliminado');
        const ageMs = Date.now() - new Date(msg.createdAt).getTime();
        if (ageMs > DELETE_FOR_ALL_MAX_AGE_MS) {
            throw new common_1.BadRequestException('Solo puedes eliminar mensajes con menos de 1 hora de antiguedad');
        }
        const updated = await this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { deletedForAll: true },
            select: MESSAGE_SELECT,
        });
        return formatMessage(updated, chat?.vendor?.userId, chat?.vendor?.businessName);
    }
    async markDelivered(chatId, userId, messageIds) {
        await this.verifyAccess(chatId, userId);
        const where = {
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
    async markRead(chatId, userId, messageIds) {
        await this.verifyAccess(chatId, userId);
        const where = {
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
    async getUnreadSummary(userId) {
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
        const chatToRequest = new Map(chats.map((c) => [c.id, c.requestId]));
        const byRequestId = {};
        const byChatId = {};
        let totalUnread = 0;
        for (const entry of unreadCounts ?? []) {
            const count = entry?._count?.id ?? 0;
            if (count <= 0)
                continue;
            const chatId = String(entry.chatId ?? '');
            const requestId = chatToRequest.get(chatId) ?? '';
            if (requestId) {
                byRequestId[requestId] = (byRequestId[requestId] ?? 0) + count;
            }
            byChatId[chatId] = count;
            totalUnread += count;
        }
        return { totalUnread, byRequestId, byChatId };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        chat_presence_service_1.ChatPresenceService])
], ChatService);
//# sourceMappingURL=chat.service.js.map