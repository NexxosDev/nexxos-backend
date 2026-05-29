import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ChatPresenceService } from '../notification/chat-presence.service';
export declare class ChatService {
    private readonly prisma;
    private readonly notificationService;
    private readonly chatPresence;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService, chatPresence: ChatPresenceService);
    private verifyAccess;
    getChatDetail(chatId: string, userId: string): Promise<{
        id: string;
        requestId: string;
        vendorId: string;
        vendorUserId: string;
        clientId: string;
        requestSummary: string;
        otherUserName: string;
        unreadCount: number;
        createdAt: string;
    }>;
    getMessages(chatId: string, userId: string, limit?: number, before?: string): Promise<{
        items: ({
            id: any;
            senderId: any;
            senderName: string;
            messageText: any;
            messageType: any;
            imageUrl: any;
            latitude: any;
            longitude: any;
            addressText: any;
            audioUrl: any;
            audioDuration: any;
            status: any;
            isEdited: any;
            deletedForAll: boolean;
            replyTo: {
                id: any;
                messageText: any;
                senderName: string;
            } | null;
            createdAt: any;
        } | null)[];
        hasMore: boolean;
    }>;
    sendMessage(chatId: string, userId: string, messageText: string, messageType?: string, imageUrl?: string, replyToId?: string, latitude?: number, longitude?: number, addressText?: string, audioUrl?: string, audioDuration?: number): Promise<{
        id: any;
        senderId: any;
        senderName: string;
        messageText: any;
        messageType: any;
        imageUrl: any;
        latitude: any;
        longitude: any;
        addressText: any;
        audioUrl: any;
        audioDuration: any;
        status: any;
        isEdited: any;
        deletedForAll: boolean;
        replyTo: {
            id: any;
            messageText: any;
            senderName: string;
        } | null;
        createdAt: any;
    } | null>;
    editMessage(chatId: string, messageId: string, userId: string, newText: string): Promise<{
        id: any;
        senderId: any;
        senderName: string;
        messageText: any;
        messageType: any;
        imageUrl: any;
        latitude: any;
        longitude: any;
        addressText: any;
        audioUrl: any;
        audioDuration: any;
        status: any;
        isEdited: any;
        deletedForAll: boolean;
        replyTo: {
            id: any;
            messageText: any;
            senderName: string;
        } | null;
        createdAt: any;
    } | null>;
    deleteMessage(chatId: string, messageId: string, userId: string): Promise<{
        id: any;
        senderId: any;
        senderName: string;
        messageText: any;
        messageType: any;
        imageUrl: any;
        latitude: any;
        longitude: any;
        addressText: any;
        audioUrl: any;
        audioDuration: any;
        status: any;
        isEdited: any;
        deletedForAll: boolean;
        replyTo: {
            id: any;
            messageText: any;
            senderName: string;
        } | null;
        createdAt: any;
    } | null>;
    markDelivered(chatId: string, userId: string, messageIds?: string[]): Promise<{
        updated: number;
    }>;
    markRead(chatId: string, userId: string, messageIds?: string[]): Promise<{
        updated: number;
    }>;
    getUnreadSummary(userId: string): Promise<{
        totalUnread: number;
        byRequestId: {};
        byChatId?: undefined;
    } | {
        totalUnread: number;
        byRequestId: Record<string, number>;
        byChatId: Record<string, number>;
    }>;
}
