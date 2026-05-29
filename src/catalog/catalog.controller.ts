import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('states')
  @ApiOperation({ summary: 'List all states' })
  getStates() {
    return this.catalogService.getStates();
  }

  @Get('municipalities')
  @ApiOperation({ summary: 'List municipalities (optionally by state)' })
  @ApiQuery({ name: 'stateId', required: false })
  getMunicipalities(@Query('stateId') stateId?: string) {
    return this.catalogService.getMunicipalities(stateId);
  }

  @Get('parishes')
  @ApiOperation({ summary: 'List parishes (optionally by municipality)' })
  @ApiQuery({ name: 'municipalityId', required: false })
  getParishes(@Query('municipalityId') municipalityId?: string) {
    return this.catalogService.getParishes(municipalityId);
  }

  @Get('vehicle-brands')
  @ApiOperation({ summary: 'List vehicle brands' })
  getVehicleBrands() {
    return this.catalogService.getVehicleBrands();
  }

  @Get('vehicle-models')
  @ApiOperation({ summary: 'List vehicle models (optionally by brand)' })
  @ApiQuery({ name: 'brandId', required: false })
  getVehicleModels(@Query('brandId') brandId?: string) {
    return this.catalogService.getVehicleModels(brandId);
  }

  @Get('part-categories')
  @ApiOperation({ summary: 'List part categories' })
  getPartCategories() {
    return this.catalogService.getPartCategories();
  }

  @Get('part-subcategories')
  @ApiOperation({ summary: 'List part subcategories (optionally by category)' })
  @ApiQuery({ name: 'categoryId', required: false })
  getPartSubcategories(@Query('categoryId') categoryId?: string) {
    return this.catalogService.getPartSubcategories(categoryId);
  }

  @Get('part-search')
  @ApiOperation({ summary: 'Search parts by name or keyword (supports Venezuelan slang)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  searchParts(@Query('q') q: string) {
    return this.catalogService.searchParts(q);
  }
}
