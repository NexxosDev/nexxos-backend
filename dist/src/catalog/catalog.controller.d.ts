import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
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
    searchParts(q: string): Promise<{
        items: {
            subcategoryId: string;
            subcategoryName: string;
            categoryId: string;
            categoryName: string;
            score: number;
        }[];
    }>;
}
