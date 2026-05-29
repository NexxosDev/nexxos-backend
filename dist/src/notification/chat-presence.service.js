"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ChatPresenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPresenceService = void 0;
const common_1 = require("@nestjs/common");
let ChatPresenceService = ChatPresenceService_1 = class ChatPresenceService {
    logger = new common_1.Logger(ChatPresenceService_1.name);
    activeChats = new Map();
    setActive(userId, chatId) {
        this.activeChats.set(userId, chatId);
        this.logger.debug(`User ${userId} is now active in chat ${chatId}`);
    }
    clearActive(userId) {
        this.activeChats.delete(userId);
        this.logger.debug(`User ${userId} cleared active chat`);
    }
    isUserInChat(userId, chatId) {
        return this.activeChats.get(userId) === chatId;
    }
};
exports.ChatPresenceService = ChatPresenceService;
exports.ChatPresenceService = ChatPresenceService = ChatPresenceService_1 = __decorate([
    (0, common_1.Injectable)()
], ChatPresenceService);
//# sourceMappingURL=chat-presence.service.js.map