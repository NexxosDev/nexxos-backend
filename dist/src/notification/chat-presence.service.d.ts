export declare class ChatPresenceService {
    private readonly logger;
    private readonly activeChats;
    setActive(userId: string, chatId: string): void;
    clearActive(userId: string): void;
    isUserInChat(userId: string, chatId: string): boolean;
}
