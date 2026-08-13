import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateBlockDto } from './dto/create-block.dto';

@ApiTags('Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  @Post('reports')
  @ApiOperation({ summary: 'Reporta contenido o usuario objetable (UGC)' })
  createReport(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.service.createReport(userId, dto);
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Lista los usuarios bloqueados por el usuario actual' })
  listBlocks(@CurrentUser('id') userId: string) {
    return this.service.listBlocks(userId);
  }

  @Post('blocks')
  @ApiOperation({ summary: 'Bloquea a un usuario' })
  block(@CurrentUser('id') userId: string, @Body() dto: CreateBlockDto) {
    return this.service.blockUser(userId, dto);
  }

  @Delete('blocks/:blockedUserId')
  @ApiOperation({ summary: 'Desbloquea a un usuario' })
  @ApiParam({ name: 'blockedUserId', description: 'ID del usuario a desbloquear' })
  unblock(@CurrentUser('id') userId: string, @Param('blockedUserId') blockedUserId: string) {
    return this.service.unblockUser(userId, blockedUserId);
  }
}
