export declare class UpgradeToVendorDto {
    businessName: string;
    rif: string;
    country?: string;
    city?: string;
    state?: string;
    municipality?: string;
    parish?: string;
    street?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    referencePoint?: string;
    fullAddress?: string;
    vehicleModelIds: string[];
    partSubcategoryIds: string[];
    documentImagePath?: string;
    logoPath?: string;
    personalDocPath?: string;
    selfiePath?: string;
    identityVerified?: boolean;
}
