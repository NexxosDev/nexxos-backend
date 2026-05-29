import { PrismaService } from '../prisma/prisma.service';
export declare class CatalogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStates(): Promise<{
        items: {
            id: string;
            name: string;
            capital: string | null;
            isoCode: string | null;
        }[];
    }>;
    getMunicipalities(stateId?: string): Promise<{
        items: {
            id: string;
            name: string;
            stateId: string;
        }[];
    }>;
    getParishes(municipalityId?: string): Promise<{
        items: {
            id: string;
            name: string;
            municipalityId: string;
        }[];
    }>;
    getVehicleBrands(): Promise<{
        items: {
            id: string;
            name: string;
            displayOrder: number | null;
        }[];
    }>;
    getVehicleModels(brandId?: string): Promise<{
        items: {
            id: string;
            name: string;
            brandId: string;
        }[];
    }>;
    getPartCategories(): Promise<{
        items: {
            id: string;
            name: string;
            displayOrder: number | null;
        }[];
    }>;
    getPartSubcategories(categoryId?: string): Promise<{
        items: {
            id: string;
            name: string;
            categoryId: string;
        }[];
    }>;
    searchParts(query: string): Promise<{
        items: {
            subcategoryId: string;
            subcategoryName: string;
            categoryId: string;
            categoryName: string;
            score: number;
        }[];
    }>;
}
