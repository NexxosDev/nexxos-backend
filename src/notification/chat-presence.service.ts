import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory store tracking which chat each user currently has open.
 * When the user is viewing a specific chat, push notifications for new
 * messages in that chat are suppressed (the message is delivered via
 * polling / websocket instead).
 *
 * Transient by design – if the server restarts, all presence is cleared
 * and the frontend will re-register on the next screen mount.
 */
@Injectable()
export class ChatPresenceService {
  private readonly logger = new Logger(ChatPresenceService.name);

  /** userId → chatId they are currently viewing */
  private readonly activeChats = new Map<string, string>();

  /** Mark that `userId` is actively viewing `chatId` */
  setActive(userId: string, chatId: string) {
    this.activeChats.set(userId, chatId);
    this.logger.debug(`User ${userId} is now active in chat ${chatId}`);
  }

  /** Mark that `userId` is no longer viewing any chat */
  clearActive(userId: string) {
    this.activeChats.delete(userId);
    this.logger.debug(`User ${userId} cleared active chat`);
  }

  /** Check if `userId` is currently viewing `chatId` */
  isUserInChat(userId: string, chatId: string): boolean {
    return this.activeChats.get(userId) === chatId;
  }
}
