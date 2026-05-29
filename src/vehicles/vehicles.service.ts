import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface NhtsaResult {
  Variable: string;
  Value: string | null;
  ValueId: string | null;
}

export interface VinDecodeResult {
  success: boolean;
  vin: string;
  nhtsa: {
    make: string | null;
    model: string | null;
    year: string | null;
    engineModel: string | null;
    engineCylinders: string | null;
    displacementL: string | null;
    fuelType: string | null;
    bodyClass: string | null;
  };
  matched: {
    brandId: string | null;
    brandName: string | null;
    modelId: string | null;
    modelName: string | null;
  };
  message: string;
}

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async decodeVin(vin: string): Promise<VinDecodeResult> {
    const cleanVin = (vin ?? '').trim().toUpperCase();
    if (cleanVin.length !== 17) {
      throw new BadRequestException('El VIN debe tener exactamente 17 caracteres');
    }

    // Call NHTSA API
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(cleanVin)}?format=json`;
    let nhtsaData: NhtsaResult[] = [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.error(`NHTSA API returned ${response.status}`);
        throw new BadRequestException('No se pudo consultar la base de datos de vehículos. Intenta de nuevo.');
      }

      const json = await response.json();
      nhtsaData = json?.Results ?? [];
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`NHTSA API error: ${err?.message}`);
      throw new BadRequestException('Error al consultar la base de datos de vehículos. Intenta de nuevo.');
    }

    // Extract key fields
    const getValue = (varName: string): string | null => {
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

    // Check for error codes from NHTSA
    const errorCode = getValue('Error Code');
    if (errorCode && !errorCode.startsWith('0')) {
      // Non-zero error codes indicate issues
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

    // Fuzzy match brand against our catalog
    const brands = await this.prisma.vehicleBrand.findMany({ select: { id: true, name: true } });
    const matchedBrand = this.fuzzyMatch(make, brands);

    // Fuzzy match model if brand was matched
    let matchedModel: { id: string; name: string } | null = null;
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

  /**
   * Fuzzy match a name against a list of catalog items.
   * Tries exact match, then case-insensitive, then normalized contains, then Levenshtein.
   */
  private fuzzyMatch(
    target: string,
    items: { id: string; name: string }[],
  ): { id: string; name: string } | null {
    if (!target || !items?.length) return null;
    const t = this.normalize(target);

    // 1. Exact case-insensitive
    const exact = items.find((i) => this.normalize(i?.name ?? '') === t);
    if (exact) return exact;

    // 2. One contains the other (handles "HILUX" matching "Hilux" or "Hilux 4x4")
    const containsMatch = items.find((i) => {
      const n = this.normalize(i?.name ?? '');
      return n.includes(t) || t.includes(n);
    });
    if (containsMatch) return containsMatch;

    // 3. Levenshtein distance — allow up to 30% of the target length
    const maxDist = Math.max(2, Math.floor(t.length * 0.3));
    let bestItem: { id: string; name: string } | null = null;
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

  private normalize(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]/g, '');     // alphanumeric only
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }
}
