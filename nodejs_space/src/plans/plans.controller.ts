import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, UseGuards, HttpCode, Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';

@ApiTags('Plans')
@Controller('api')
export class PlansController {
  private readonly logger = new Logger(PlansController.name);

  constructor(private readonly plansService: PlansService) {}

  // ── Vendor: get my plan ──
  @Get('vendors/my-plan')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current vendor plan, subscription info, and monthly request count' })
  async getMyPlan(@Req() req: any) {
    return this.plansService.getMyPlan(req.user.id);
  }

  // ── List visible plans (optionally filter by vendor's current plan) ──
  @Get('plans')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List plans visible in app (filters out lower-priority plans if vendor has active subscription)' })
  async listVisiblePlans(@Req() req: any) {
    return this.plansService.listVisiblePlans(req.user?.id);
  }

  // ── Admin: list all plans ──
  @Get('admin/plans')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: List all plans (including hidden)' })
  async listAllPlans() {
    return this.plansService.listAllPlans();
  }

  // ── Admin: create plan ──
  @Post('admin/plans')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Create a new plan' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.createPlan(dto);
  }

  // ── Admin: delete plan ──
  @Delete('admin/plans/:planId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Delete a plan (only if no active subscriptions)' })
  async deletePlan(@Param('planId') planId: string) {
    return this.plansService.deletePlan(planId);
  }

  // ── Admin: update plan ──
  @Patch('admin/plans/:planId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: Update plan configuration' })
  async updatePlan(@Param('planId') planId: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.updatePlan(planId, dto);
  }

  // ── Admin: assign plan to vendor ──
  @Post('admin/vendors/:vendorId/plan')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  @ApiOperation({ summary: 'Admin: Assign plan to a vendor' })
  async adminAssignPlan(@Param('vendorId') vendorId: string, @Body() dto: AssignPlanDto) {
    return this.plansService.adminAssignPlan(vendorId, dto.planSlug, dto.expirationMonths);
  }

  // ── Admin: list vendors with plans ──
  @Get('admin/vendors-plans')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Admin: List vendors with their current plans' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listVendorsWithPlans(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.plansService.listVendorsWithPlans(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ── Cron: check expirations ──
  @Post('plans/check-expirations')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cron: Check plan expirations and send notifications' })
  async checkExpirations() {
    return this.plansService.checkExpirations();
  }

  // ── Cron: reset monthly counts ──
  @Post('plans/reset-monthly-counts')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cron: Reset monthly request counts (no-op, counts are per year/month)' })
  async resetMonthlyCounts() {
    return this.plansService.resetMonthlyCounts();
  }
}
