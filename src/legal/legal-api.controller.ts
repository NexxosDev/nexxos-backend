import { Controller, Get, Put, Param, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { LegalService } from './legal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Legal')
@Controller('api/legal')
export class LegalApiController {
  private readonly logger = new Logger(LegalApiController.name);

  constructor(private readonly legalService: LegalService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los documentos legales (sin contenido)' })
  async findAll() {
    return this.legalService.findAll();
  }

  @Get('faq')
  @ApiOperation({ summary: 'Obtener FAQ estructurado (JSON con categorías y preguntas)' })
  async getFaq() {
    const doc = await this.legalService.findByKey('faq');
    try {
      const parsed = JSON.parse(doc?.content ?? '{}');
      return { id: doc?.id, title: doc?.title, updatedAt: doc?.updatedAt, ...parsed };
    } catch {
      return { id: doc?.id, title: doc?.title, updatedAt: doc?.updatedAt, categories: [] };
    }
  }

  @Get(':key')
  @ApiOperation({ summary: 'Obtener documento legal por key (terminos, privacidad, sobre-nosotros, faq)' })
  @ApiParam({ name: 'key', enum: ['terminos', 'privacidad', 'sobre-nosotros', 'faq'] })
  async findByKey(@Param('key') key: string) {
    return this.legalService.findByKey(key);
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar documento legal (solo ADMIN)' })
  @ApiParam({ name: 'key', enum: ['terminos', 'privacidad', 'sobre-nosotros', 'faq'] })
  @ApiBody({ schema: { type: 'object', properties: { content: { type: 'string' }, title: { type: 'string' } }, required: ['content'] } })
  async update(
    @Param('key') key: string,
    @Body() body: { content: string; title?: string },
  ) {
    this.logger.log(`Admin updating legal document: ${key}`);
    return this.legalService.update(key, body?.content, body?.title);
  }
}
