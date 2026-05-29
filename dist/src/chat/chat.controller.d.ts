import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { MarkMessagesDto } from './dto/mark-messages.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getUnreadSummary(userId: string): Promise<{
        totalUnread: number;
        byRequestId: {};
        byChatId?: undefined;
    } | {
        totalUnread: number;
        byRequestId: Record<string, number>;
        byChatId: Record<string, number>;
    }>;
    getChat(userId: string, chatId: string): Promise<{
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
    getMessages(userId: string, chatId: string, limit?: string, before?: string): Promise<{
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
    sendMessage(userId: string, chatId: string, dto: SendMessageDto): Promise<{
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
    editMessage(userId: string, chatId: string, messageId: string, dto: EditMessageDto): Promise<{
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
    deleteMessage(userId: string, chatId: string, messageId: string): Promise<{
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
    markDelivered(userId: string, chatId: string, dto: MarkMessagesDto): Promise<{
        updated: number;
    }>;
    markRead(userId: string, chatId: string, dto: MarkMessagesDto): Promise<{
        updated: number;
    }>;
}
