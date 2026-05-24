import { Controller, Post, Get, Patch, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateRequestDto } from './dto/create-request.dto';
import { CloseRequestDto } from './dto/close-request.dto';
import { UpdateResponseTagsDto } from './dto/update-response-tags.dto';
import { RateVendorDto } from './dto/rate-vendor.dto';

@ApiTags('Requests (Cron)')
@Controller('api/requests')
export class RequestsCronController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('cron/expand-radius')
  @ApiOperation({ summary: 'Cron: Auto-expand search radius for requests without responses' })
  expandRadii() {
    return this.requestsService.expandSearchRadii();
  }
}

@ApiTags('Requests (Client)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'Create a new part request (with auto-matching)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRequestDto) {
    return this.requestsService.createRequest(userId, dto);
  }

  @Get()
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'List client requests' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'hasResponses', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('hasResponses') hasResponses?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.requestsService.listClientRequests(
      userId, status, hasResponses,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get('pending-ratings')
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'Get closed requests without a rating (pending ratings)' })
  getPendingRatings(@CurrentUser('id') userId: string) {
    return this.requestsService.getPendingRatings(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get request detail' })
  getDetail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.requestsService.getRequestDetail(id, userId);
  }

  @Get(':id/responses')
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'List vendor responses for a request' })
  getResponses(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.requestsService.getRequestResponses(id, userId);
  }

  @Patch(':id/close')
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'Close a request (with optional rating)' })
  close(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CloseRequestDto,
  ) {
    return this.requestsService.closeRequest(id, userId, dto);
  }

  @Post(':id/rate')
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'Rate a vendor on a closed request (1 rating per request)' })
  rateVendor(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RateVendorDto,
  ) {
    return this.requestsService.rateVendorOnClosedRequest(id, userId, dto.vendorId, dto.rating, dto.comment);
  }

  @Put('responses/:responseId/tags')
  @Roles('CLIENTE')
  @ApiOperation({ summary: 'Update tags on a vendor response (replaces existing tags)' })
  updateTags(
    @CurrentUser('id') userId: string,
    @Param('responseId') responseId: string,
    @Body() dto: UpdateResponseTagsDto,
  ) {
    return this.requestsService.updateResponseTags(responseId, userId, dto.tags);
  }
}
