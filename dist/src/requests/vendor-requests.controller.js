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
exports.VendorRequestsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const requests_service_1 = require("./requests.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const respond_request_dto_1 = require("./dto/respond-request.dto");
let VendorRequestsController = class VendorRequestsController {
    requestsService;
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    list(userId, status, limit, offset) {
        return this.requestsService.listVendorRequests(userId, status, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
    }
    getDetail(userId, matchId) {
        return this.requestsService.getVendorMatchDetail(userId, matchId);
    }
    respond(userId, matchId, dto) {
        return this.requestsService.respondToRequest(userId, matchId, dto);
    }
    decline(userId, matchId) {
        return this.requestsService.declineRequest(userId, matchId);
    }
};
exports.VendorRequestsController = VendorRequestsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List matched requests for vendor' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'RESPONDED', 'DECLINED'] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], VendorRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':matchId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get matched request detail' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VendorRequestsController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Post)(':matchId/respond'),
    (0, swagger_1.ApiOperation)({ summary: 'Respond to a matched request (creates chat)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('matchId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, respond_request_dto_1.RespondRequestDto]),
    __metadata("design:returntype", void 0)
], VendorRequestsController.prototype, "respond", null);
__decorate([
    (0, common_1.Post)(':matchId/decline'),
    (0, swagger_1.ApiOperation)({ summary: 'Decline a matched request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VendorRequestsController.prototype, "decline", null);
exports.VendorRequestsController = VendorRequestsController = __decorate([
    (0, swagger_1.ApiTags)('Vendor Requests'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, common_1.Controller)('api/vendor/requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], VendorRequestsController);
//# sourceMappingURL=vendor-requests.controller.js.map