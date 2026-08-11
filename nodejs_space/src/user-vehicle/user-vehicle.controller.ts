import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UserVehicleService } from './user-vehicle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateUserVehicleDto } from './dto/create-user-vehicle.dto';
import { UpdateUserVehicleDto } from './dto/update-user-vehicle.dto';

@ApiTags('User Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/user-vehicles')
export class UserVehicleController {
  constructor(private readonly service: UserVehicleService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los vehículos guardados del usuario (Garaje Virtual)' })
  list(@CurrentUser('id') userId: string) {
    return this.service.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Agrega un vehículo al garaje (máximo 3)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateUserVehicleDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un vehículo guardado o lo marca como favorito' })
  @ApiParam({ name: 'id', description: 'ID del vehículo guardado' })
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateUserVehicleDto) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un vehículo del garaje' })
  @ApiParam({ name: 'id', description: 'ID del vehículo guardado' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
