import { PrismaService } from '../prisma/prisma.service';
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
export declare class VehiclesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    decodeVin(vin: string): Promise<VinDecodeResult>;
    private fuzzyMatch;
    private normalize;
    private levenshtein;
}
