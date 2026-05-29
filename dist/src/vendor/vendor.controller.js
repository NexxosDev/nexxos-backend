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
exports.VendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vendor_service_1 = require("./vendor.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const update_vendor_dto_1 = require("./dto/update-vendor.dto");
const availability_dto_1 = require("./dto/availability.dto");
const quick_reply_dto_1 = require("./dto/quick-reply.dto");
let VendorController = class VendorController {
    vendorService;
    constructor(vendorService) {
        this.vendorService = vendorService;
    }
    getProfile(userId) {
        return this.vendorService.getVendorProfile(userId);
    }
    updateProfile(userId, dto) {
        return this.vendorService.updateVendor(userId, dto);
    }
    toggleAvailability(userId, dto) {
        return this.vendorService.toggleAvailability(userId, dto.isAvailable);
    }
    getDashboard(userId) {
        return this.vendorService.getDashboard(userId);
    }
    getResponseTimeMetrics(userId) {
        return this.vendorService.getResponseTimeMetrics(userId);
    }
    getQuickReplies(userId) {
        return this.vendorService.getQuickReplies(userId);
    }
    createQuickReply(userId, dto) {
        return this.vendorService.createQuickReply(userId, dto.messageText);
    }
    reorderQuickReplies(userId, dto) {
        return this.vendorService.reorderQuickReplies(userId, dto.items);
    }
    updateQuickReply(userId, id, dto) {
        return this.vendorService.updateQuickReply(userId, id, dto.messageText ?? '');
    }
    deleteQuickReply(userId, id) {
        return this.vendorService.deleteQuickReply(userId, id);
    }
    getVendorById(id) {
        return this.vendorService.getVendorById(id);
    }
};
exports.VendorController = VendorController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current vendor profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current vendor profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_vendor_dto_1.UpdateVendorDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)('availability'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle vendor availability' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, availability_dto_1.AvailabilityDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "toggleAvailability", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor dashboard with metrics and recent requests' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('response-metrics'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor response time metrics (avg, median, fastest, slowest, rate)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getResponseTimeMetrics", null);
__decorate([
    (0, common_1.Get)('quick-replies'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor quick replies (seeds defaults on first call)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getQuickReplies", null);
__decorate([
    (0, common_1.Post)('quick-replies'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new quick reply' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quick_reply_dto_1.CreateQuickReplyDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "createQuickReply", null);
__decorate([
    (0, common_1.Put)('quick-replies/reorder'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder quick replies' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quick_reply_dto_1.ReorderQuickRepliesDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "reorderQuickReplies", null);
__decorate([
    (0, common_1.Put)('quick-replies/:id'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a quick reply' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, quick_reply_dto_1.UpdateQuickReplyDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateQuickReply", null);
__decorate([
    (0, common_1.Delete)('quick-replies/:id'),
    (0, roles_decorator_1.Roles)('VENDEDOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a quick reply' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "deleteQuickReply", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getVendorById", null);
exports.VendorController = VendorController = __decorate([
    (0, swagger_1.ApiTags)('Vendor'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/vendor'),
    __metadata("design:paramtypes", [vendor_service_1.VendorService])
], VendorController);
//# sourceMappingURL=vendor.controller.js.map