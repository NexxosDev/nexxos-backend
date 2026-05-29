import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { RespondRequestDto } from './dto/respond-request.dto';

@ApiTags('Vendor Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDEDOR')
@Controller('api/vendor/requests')
export class VendorRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List matched requests for vendor' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'RESPONDED', 'DECLINED'] })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.requestsService.listVendorRequests(
      userId, status,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Get matched request detail' })
  getDetail(@CurrentUser('id') userId: string, @Param('matchId') matchId: string) {
    return this.requestsService.getVendorMatchDetail(userId, matchId);
  }

  @Post(':matchId/respond')
  @ApiOperation({ summary: 'Respond to a matched request (creates chat)' })
  respond(
    @CurrentUser('id') userId: string,
    @Param('matchId') matchId: string,
    @Body() dto: RespondRequestDto,
  ) {
    return this.requestsService.respondToRequest(userId, matchId, dto);
  }

  @Post(':matchId/decline')
  @ApiOperation({ summary: 'Decline a matched request' })
  decline(@CurrentUser('id') userId: string, @Param('matchId') matchId: string) {
    return this.requestsService.declineRequest(userId, matchId);
  }
}
