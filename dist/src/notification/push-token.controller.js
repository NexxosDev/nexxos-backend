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
exports.PushTokenController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const notification_service_1 = require("./notification.service");
const register_token_dto_1 = require("./dto/register-token.dto");
let PushTokenController = class PushTokenController {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async register(req, dto) {
        return this.notificationService.registerToken(req.user.id, dto.token, dto.platform);
    }
    async remove(body) {
        return this.notificationService.removeToken(body?.token ?? '');
    }
};
exports.PushTokenController = PushTokenController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register Expo Push Token for current user' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_token_dto_1.RegisterTokenDto]),
    __metadata("design:returntype", Promise)
], PushTokenController.prototype, "register", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Remove push token (logout)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushTokenController.prototype, "remove", null);
exports.PushTokenController = PushTokenController = __decorate([
    (0, swagger_1.ApiTags)('Push Notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('api/push-tokens'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], PushTokenController);
//# sourceMappingURL=push-token.controller.js.map