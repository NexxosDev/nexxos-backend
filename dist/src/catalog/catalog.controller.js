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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catalog_service_1 = require("./catalog.service");
let CatalogController = class CatalogController {
    catalogService;
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    getStates() {
        return this.catalogService.getStates();
    }
    getMunicipalities(stateId) {
        return this.catalogService.getMunicipalities(stateId);
    }
    getParishes(municipalityId) {
        return this.catalogService.getParishes(municipalityId);
    }
    getVehicleBrands() {
        return this.catalogService.getVehicleBrands();
    }
    getVehicleModels(brandId) {
        return this.catalogService.getVehicleModels(brandId);
    }
    getPartCategories() {
        return this.catalogService.getPartCategories();
    }
    getPartSubcategories(categoryId) {
        return this.catalogService.getPartSubcategories(categoryId);
    }
    searchParts(q) {
        return this.catalogService.searchParts(q);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('states'),
    (0, swagger_1.ApiOperation)({ summary: 'List all states' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getStates", null);
__decorate([
    (0, common_1.Get)('municipalities'),
    (0, swagger_1.ApiOperation)({ summary: 'List municipalities (optionally by state)' }),
    (0, swagger_1.ApiQuery)({ name: 'stateId', required: false }),
    __param(0, (0, common_1.Query)('stateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getMunicipalities", null);
__decorate([
    (0, common_1.Get)('parishes'),
    (0, swagger_1.ApiOperation)({ summary: 'List parishes (optionally by municipality)' }),
    (0, swagger_1.ApiQuery)({ name: 'municipalityId', required: false }),
    __param(0, (0, common_1.Query)('municipalityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getParishes", null);
__decorate([
    (0, common_1.Get)('vehicle-brands'),
    (0, swagger_1.ApiOperation)({ summary: 'List vehicle brands' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getVehicleBrands", null);
__decorate([
    (0, common_1.Get)('vehicle-models'),
    (0, swagger_1.ApiOperation)({ summary: 'List vehicle models (optionally by brand)' }),
    (0, swagger_1.ApiQuery)({ name: 'brandId', required: false }),
    __param(0, (0, common_1.Query)('brandId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getVehicleModels", null);
__decorate([
    (0, common_1.Get)('part-categories'),
    (0, swagger_1.ApiOperation)({ summary: 'List part categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getPartCategories", null);
__decorate([
    (0, common_1.Get)('part-subcategories'),
    (0, swagger_1.ApiOperation)({ summary: 'List part subcategories (optionally by category)' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false }),
    __param(0, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getPartSubcategories", null);
__decorate([
    (0, common_1.Get)('part-search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search parts by name or keyword (supports Venezuelan slang)' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query (min 2 chars)' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "searchParts", null);
exports.CatalogController = CatalogController = __decorate([
    (0, swagger_1.ApiTags)('Catalog'),
    (0, common_1.Controller)('api/catalog'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map