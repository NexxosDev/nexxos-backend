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
exports.ChatPresenceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const chat_presence_service_1 = require("./chat-presence.service");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
class SetPresenceDto {
    chatId;
}
__decorate([
    (0, swagger_2.ApiProperty)({ description: 'The chat ID the user is currently viewing' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SetPresenceDto.prototype, "chatId", void 0);
let ChatPresenceController = class ChatPresenceController {
    chatPresence;
    constructor(chatPresence) {
        this.chatPresence = chatPresence;
    }
    async setActive(req, dto) {
        this.chatPresence.setActive(req.user.id, dto.chatId);
        return { success: true };
    }
    async clearActive(req) {
        this.chatPresence.clearActive(req.user.id);
        return { success: true };
    }
};
exports.ChatPresenceController = ChatPresenceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Report that the user is actively viewing a chat (suppresses push notifications for that chat)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SetPresenceDto]),
    __metadata("design:returntype", Promise)
], ChatPresenceController.prototype, "setActive", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Clear active chat presence (re-enables push notifications)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatPresenceController.prototype, "clearActive", null);
exports.ChatPresenceController = ChatPresenceController = __decorate([
    (0, swagger_1.ApiTags)('Chat Presence'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('api/chat-presence'),
    __metadata("design:paramtypes", [chat_presence_service_1.ChatPresenceService])
], ChatPresenceController);
//# sourceMappingURL=chat-presence.controller.js.map