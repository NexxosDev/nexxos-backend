export declare class CreatePlanDto {
    name: string;
    slug?: string;
    description?: string;
    solicitudesMensuales?: number;
    prioridad?: number;
    precioMensual?: number;
    precioAnual?: number;
    comisionPorcentaje?: number;
    visibleEnApp?: boolean;
    isActive?: boolean;
    price?: number;
    billingCycle?: string;
}
