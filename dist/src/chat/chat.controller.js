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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const send_message_dto_1 = require("./dto/send-message.dto");
const edit_message_dto_1 = require("./dto/edit-message.dto");
const mark_messages_dto_1 = require("./dto/mark-messages.dto");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    getUnreadSummary(userId) {
        return this.chatService.getUnreadSummary(userId);
    }
    getChat(userId, chatId) {
        return this.chatService.getChatDetail(chatId, userId);
    }
    getMessages(userId, chatId, limit, before) {
        return this.chatService.getMessages(chatId, userId, limit ? parseInt(limit) : undefined, before);
    }
    sendMessage(userId, chatId, dto) {
        return this.chatService.sendMessage(chatId, userId, dto.messageText, dto.messageType ?? 'text', dto.imageUrl, dto.replyToId, dto.latitude, dto.longitude, dto.addressText, dto.audioUrl, dto.audioDuration);
    }
    editMessage(userId, chatId, messageId, dto) {
        return this.chatService.editMessage(chatId, messageId, userId, dto.messageText);
    }
    deleteMessage(userId, chatId, messageId) {
        return this.chatService.deleteMessage(chatId, messageId, userId);
    }
    markDelivered(userId, chatId, dto) {
        return this.chatService.markDelivered(chatId, userId, dto.messageIds);
    }
    markRead(userId, chatId, dto) {
        return this.chatService.markRead(chatId, userId, dto.messageIds);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('unread-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total unread message count and breakdown by requestId' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getUnreadSummary", null);
__decorate([
    (0, common_1.Get)(':chatId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat detail' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getChat", null);
__decorate([
    (0, common_1.Get)(':chatId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat messages (paginated)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'before', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(':chatId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message in chat' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)(':chatId/messages/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit a sent message (own messages only, text only)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, edit_message_dto_1.EditMessageDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "editMessage", null);
__decorate([
    (0, common_1.Delete)(':chatId/messages/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a sent message for everyone (own messages only, < 1 hour old)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Post)(':chatId/messages/mark-delivered'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark messages from the other user as delivered' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mark_messages_dto_1.MarkMessagesDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "markDelivered", null);
__decorate([
    (0, common_1.Post)(':chatId/messages/mark-read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark messages from the other user as read' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('chatId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mark_messages_dto_1.MarkMessagesDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "markRead", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map