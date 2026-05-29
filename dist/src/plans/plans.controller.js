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
var PlansController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const plans_service_1 = require("./plans.service");
const create_plan_dto_1 = require("./dto/create-plan.dto");
const update_plan_dto_1 = require("./dto/update-plan.dto");
const assign_plan_dto_1 = require("./dto/assign-plan.dto");
let PlansController = PlansController_1 = class PlansController {
    plansService;
    logger = new common_1.Logger(PlansController_1.name);
    constructor(plansService) {
        this.plansService = plansService;
    }
    async getMyPlan(req) {
        return this.plansService.getMyPlan(req.user.id);
    }
    async listVisiblePlans() {
        return this.plansService.listVisiblePlans();
    }
    async listAllPlans() {
        return this.plansService.listAllPlans();
    }
    async createPlan(dto) {
        return this.plansService.createPlan(dto);
    }
    async deletePlan(planId) {
        return this.plansService.deletePlan(planId);
    }
    async updatePlan(planId, dto) {
        return this.plansService.updatePlan(planId, dto);
    }
    async adminAssignPlan(vendorId, dto) {
        return this.plansService.adminAssignPlan(vendorId, dto.planSlug, dto.expirationMonths);
    }
    async listVendorsWithPlans(limit, offset) {
        return this.plansService.listVendorsWithPlans(limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0);
    }
    async checkExpirations() {
        return this.plansService.checkExpirations();
    }
    async resetMonthlyCounts() {
        return this.plansService.resetMonthlyCounts();
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Get)('vendors/my-plan'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Get current vendor plan, subscription info, and monthly request count' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getMyPlan", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'List plans visible in app' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "listVisiblePlans", null);
__decorate([
    (0, common_1.Get)('admin/plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: List all plans (including hidden)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "listAllPlans", null);
__decorate([
    (0, common_1.Post)('admin/plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Create a new plan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_plan_dto_1.CreatePlanDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Delete)('admin/plans/:planId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete a plan (only if no active subscriptions)' }),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Patch)('admin/plans/:planId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update plan configuration' }),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_plan_dto_1.UpdatePlanDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Post)('admin/vendors/:vendorId/plan'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Assign plan to a vendor' }),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_plan_dto_1.AssignPlanDto]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "adminAssignPlan", null);
__decorate([
    (0, common_1.Get)('admin/vendors-plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: List vendors with their current plans' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "listVendorsWithPlans", null);
__decorate([
    (0, common_1.Post)('plans/check-expirations'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Cron: Check plan expirations and send notifications' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "checkExpirations", null);
__decorate([
    (0, common_1.Post)('plans/reset-monthly-counts'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Cron: Reset monthly request counts (no-op, counts are per year/month)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "resetMonthlyCounts", null);
exports.PlansController = PlansController = PlansController_1 = __decorate([
    (0, swagger_1.ApiTags)('Plans'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map