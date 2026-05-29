export declare class VendorSignupDto {
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
    facadeImagePath?: string;
    identityVerified?: boolean;
}
export declare class SignupDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    documentId: string;
    role: string;
    vendor?: VendorSignupDto;
}
