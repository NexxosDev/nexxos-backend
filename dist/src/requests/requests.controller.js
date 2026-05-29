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
exports.RequestsController = exports.RequestsCronController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const requests_service_1 = require("./requests.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const create_request_dto_1 = require("./dto/create-request.dto");
const close_request_dto_1 = require("./dto/close-request.dto");
const update_response_tags_dto_1 = require("./dto/update-response-tags.dto");
const rate_vendor_dto_1 = require("./dto/rate-vendor.dto");
let RequestsCronController = class RequestsCronController {
    requestsService;
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    expandRadii() {
        return this.requestsService.expandSearchRadii();
    }
};
exports.RequestsCronController = RequestsCronController;
__decorate([
    (0, common_1.Post)('cron/expand-radius'),
    (0, swagger_1.ApiOperation)({ summary: 'Cron: Auto-expand search radius for requests without responses' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RequestsCronController.prototype, "expandRadii", null);
exports.RequestsCronController = RequestsCronController = __decorate([
    (0, swagger_1.ApiTags)('Requests (Cron)'),
    (0, common_1.Controller)('api/requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsCronController);
let RequestsController = class RequestsController {
    requestsService;
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    create(userId, dto) {
        return this.requestsService.createRequest(userId, dto);
    }
    list(userId, status, hasResponses, limit, offset) {
        return this.requestsService.listClientRequests(userId, status, hasResponses, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
    }
    getPendingRatings(userId) {
        return this.requestsService.getPendingRatings(userId);
    }
    getDetail(userId, id) {
        return this.requestsService.getRequestDetail(id, userId);
    }
    getResponses(userId, id) {
        return this.requestsService.getRequestResponses(id, userId);
    }
    close(userId, id, dto) {
        return this.requestsService.closeRequest(id, userId, dto);
    }
    rateVendor(userId, id, dto) {
        return this.requestsService.rateVendorOnClosedRequest(id, userId, dto.vendorId, dto.rating, dto.comment);
    }
    updateTags(userId, responseId, dto) {
        return this.requestsService.updateResponseTags(responseId, userId, dto.tags);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new part request (with auto-matching)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_request_dto_1.CreateRequestDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'List client requests' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'hasResponses', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('hasResponses')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('pending-ratings'),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'Get closed requests without a rating (pending ratings)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getPendingRatings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get request detail' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Get)(':id/responses'),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'List vendor responses for a request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "getResponses", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'Close a request (with optional rating)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, close_request_dto_1.CloseRequestDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/rate'),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'Rate a vendor on a closed request (1 rating per request)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, rate_vendor_dto_1.RateVendorDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "rateVendor", null);
__decorate([
    (0, common_1.Put)('responses/:responseId/tags'),
    (0, roles_decorator_1.Roles)('CLIENTE'),
    (0, swagger_1.ApiOperation)({ summary: 'Update tags on a vendor response (replaces existing tags)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('responseId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_response_tags_dto_1.UpdateResponseTagsDto]),
    __metadata("design:returntype", void 0)
], RequestsController.prototype, "updateTags", null);
exports.RequestsController = RequestsController = __decorate([
    (0, swagger_1.ApiTags)('Requests (Client)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/requests'),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map