import { ChatPresenceService } from './chat-presence.service';
declare class SetPresenceDto {
    chatId: string;
}
export declare class ChatPresenceController {
    private readonly chatPresence;
    constructor(chatPresence: ChatPresenceService);
    setActive(req: any, dto: SetPresenceDto): Promise<{
        success: boolean;
    }>;
    clearActive(req: any): Promise<{
        success: boolean;
    }>;
}
export {};
