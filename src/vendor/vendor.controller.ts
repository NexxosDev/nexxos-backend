import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AvailabilityDto } from './dto/availability.dto';
import { CreateQuickReplyDto, UpdateQuickReplyDto, ReorderQuickRepliesDto } from './dto/quick-reply.dto';

@ApiTags('Vendor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get('profile')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Get current vendor profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.vendorService.getVendorProfile(userId);
  }

  @Patch('profile')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Update current vendor profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateVendorDto) {
    return this.vendorService.updateVendor(userId, dto);
  }

  @Patch('availability')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Toggle vendor availability' })
  toggleAvailability(@CurrentUser('id') userId: string, @Body() dto: AvailabilityDto) {
    return this.vendorService.toggleAvailability(userId, dto.isAvailable);
  }

  @Get('dashboard')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Get vendor dashboard with metrics and recent requests' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.vendorService.getDashboard(userId);
  }

  @Get('response-metrics')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Get vendor response time metrics (avg, median, fastest, slowest, rate)' })
  getResponseTimeMetrics(@CurrentUser('id') userId: string) {
    return this.vendorService.getResponseTimeMetrics(userId);
  }

  // ── Quick Replies ──────────────────────────────────────

  @Get('quick-replies')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Get vendor quick replies (seeds defaults on first call)' })
  getQuickReplies(@CurrentUser('id') userId: string) {
    return this.vendorService.getQuickReplies(userId);
  }

  @Post('quick-replies')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Create a new quick reply' })
  createQuickReply(@CurrentUser('id') userId: string, @Body() dto: CreateQuickReplyDto) {
    return this.vendorService.createQuickReply(userId, dto.messageText);
  }

  @Put('quick-replies/reorder')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Reorder quick replies' })
  reorderQuickReplies(@CurrentUser('id') userId: string, @Body() dto: ReorderQuickRepliesDto) {
    return this.vendorService.reorderQuickReplies(userId, dto.items);
  }

  @Put('quick-replies/:id')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Update a quick reply' })
  updateQuickReply(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuickReplyDto,
  ) {
    return this.vendorService.updateQuickReply(userId, id, dto.messageText ?? '');
  }

  @Delete('quick-replies/:id')
  @Roles('VENDEDOR')
  @ApiOperation({ summary: 'Delete a quick reply' })
  deleteQuickReply(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.vendorService.deleteQuickReply(userId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  getVendorById(@Param('id') id: string) {
    return this.vendorService.getVendorById(id);
  }
}
