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
var VehiclesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VehiclesService = VehiclesService_1 = class VehiclesService {
    prisma;
    logger = new common_1.Logger(VehiclesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async decodeVin(vin) {
        const cleanVin = (vin ?? '').trim().toUpperCase();
        if (cleanVin.length !== 17) {
            throw new common_1.BadRequestException('El VIN debe tener exactamente 17 caracteres');
        }
        const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(cleanVin)}?format=json`;
        let nhtsaData = [];
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) {
                this.logger.error(`NHTSA API returned ${response.status}`);
                throw new common_1.BadRequestException('No se pudo consultar la base de datos de vehículos. Intenta de nuevo.');
            }
            const json = await response.json();
            nhtsaData = json?.Results ?? [];
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            this.logger.error(`NHTSA API error: ${err?.message}`);
            throw new common_1.BadRequestException('Error al consultar la base de datos de vehículos. Intenta de nuevo.');
        }
        const getValue = (varName) => {
            const entry = nhtsaData.find((r) => r?.Variable === varName);
            const val = entry?.Value?.trim?.() ?? '';
            return val && val !== 'Not Applicable' ? val : null;
        };
        const make = getValue('Make');
        const model = getValue('Model');
        const year = getValue('Model Year');
        const engineModel = getValue('Engine Model');
        const engineCylinders = getValue('Engine Number of Cylinders');
        const displacementL = getValue('Displacement (L)');
        const fuelType = getValue('Fuel Type - Primary');
        const bodyClass = getValue('Body Class');
        const errorCode = getValue('Error Code');
        if (errorCode && !errorCode.startsWith('0')) {
            const errorText = getValue('Error Text') ?? 'VIN no reconocido';
            this.logger.warn(`NHTSA decode error for VIN ${cleanVin}: ${errorCode} - ${errorText}`);
        }
        if (!make) {
            return {
                success: false,
                vin: cleanVin,
                nhtsa: { make: null, model: null, year: null, engineModel: null, engineCylinders: null, displacementL: null, fuelType: null, bodyClass: null },
                matched: { brandId: null, brandName: null, modelId: null, modelName: null },
                message: 'No pudimos decodificar este VIN. Selecciona marca y modelo manualmente.',
            };
        }
        const brands = await this.prisma.vehicleBrand.findMany({ select: { id: true, name: true } });
        const matchedBrand = this.fuzzyMatch(make, brands);
        let matchedModel = null;
        if (matchedBrand && model) {
            const models = await this.prisma.vehicleModel.findMany({
                where: { brandId: matchedBrand.id },
                select: { id: true, name: true },
            });
            matchedModel = this.fuzzyMatch(model, models);
        }
        const message = matchedBrand && matchedModel
            ? `${matchedBrand.name} ${matchedModel.name}${year ? ` (${year})` : ''} identificado`
            : matchedBrand && !matchedModel
                ? `Marca ${matchedBrand.name} identificada.${model ? ` Modelo "${model}" no encontrado en el catálogo —` : ''} Selecciónalo manualmente.`
                : `Marca "${make}" no encontrada en el catálogo. Selecciona manualmente.`;
        return {
            success: !!(matchedBrand && matchedModel),
            vin: cleanVin,
            nhtsa: { make, model, year, engineModel, engineCylinders, displacementL, fuelType, bodyClass },
            matched: {
                brandId: matchedBrand?.id ?? null,
                brandName: matchedBrand?.name ?? null,
                modelId: matchedModel?.id ?? null,
                modelName: matchedModel?.name ?? null,
            },
            message,
        };
    }
    fuzzyMatch(target, items) {
        if (!target || !items?.length)
            return null;
        const t = this.normalize(target);
        const exact = items.find((i) => this.normalize(i?.name ?? '') === t);
        if (exact)
            return exact;
        const containsMatch = items.find((i) => {
            const n = this.normalize(i?.name ?? '');
            return n.includes(t) || t.includes(n);
        });
        if (containsMatch)
            return containsMatch;
        const maxDist = Math.max(2, Math.floor(t.length * 0.3));
        let bestItem = null;
        let bestDist = maxDist + 1;
        for (const item of items) {
            const d = this.levenshtein(t, this.normalize(item?.name ?? ''));
            if (d < bestDist) {
                bestDist = d;
                bestItem = item;
            }
        }
        return bestDist <= maxDist ? bestItem : null;
    }
    normalize(s) {
        return (s ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }
    levenshtein(a, b) {
        const m = a.length;
        const n = b.length;
        if (m === 0)
            return n;
        if (n === 0)
            return m;
        const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[m][n];
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = VehiclesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map