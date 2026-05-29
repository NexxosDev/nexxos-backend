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
exports.ClientPointsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const client_points_service_1 = require("./client-points.service");
let ClientPointsController = class ClientPointsController {
    pointsService;
    constructor(pointsService) {
        this.pointsService = pointsService;
    }
    async getPoints(req) {
        return this.pointsService.getClientPointsSummary(req.user?.id);
    }
    async sendRatingReminders() {
        return this.pointsService.sendRatingReminders();
    }
};
exports.ClientPointsController = ClientPointsController;
__decorate([
    (0, common_1.Get)('points'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get client points summary (total, level, progress, history)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientPointsController.prototype, "getPoints", null);
__decorate([
    (0, common_1.Post)('rating-reminders'),
    (0, swagger_1.ApiOperation)({ summary: 'Send push reminders for unrated closed requests (cron)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientPointsController.prototype, "sendRatingReminders", null);
exports.ClientPointsController = ClientPointsController = __decorate([
    (0, swagger_1.ApiTags)('Client Points'),
    (0, common_1.Controller)('api/client'),
    __metadata("design:paramtypes", [client_points_service_1.ClientPointsService])
], ClientPointsController);
//# sourceMappingURL=client-points.controller.js.map