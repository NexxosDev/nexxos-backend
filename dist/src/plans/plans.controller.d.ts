import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';
export declare class PlansController {
    private readonly plansService;
    private readonly logger;
    constructor(plansService: PlansService);
    getMyPlan(req: any): Promise<{
        plan: null;
        subscription: null;
        monthlyRequests: {
            count: number;
            limit: number;
        };
    } | {
        plan: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            solicitudesMensuales: number;
            prioridad: number;
            precioMensual: number;
            precioAnual: number;
            comisionPorcentaje: number;
        };
        subscription: {
            id: string;
            estado: string;
            fechaAsignacion: string;
            fechaExpiracion: string | null;
            fechaGracia: string | null;
            daysRemaining: number | null;
            totalDays: number | null;
        };
        monthlyRequests: {
            count: number;
            limit: number;
        };
    }>;
    listVisiblePlans(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        slug: string;
        solicitudesMensuales: number;
        prioridad: number;
        precioMensual: number;
        precioAnual: number;
        comisionPorcentaje: number;
        visibleEnApp: boolean;
    }[]>;
    listAllPlans(): Promise<any[]>;
    createPlan(dto: CreatePlanDto): Promise<any>;
    deletePlan(planId: string): Promise<{
        deleted: boolean;
    }>;
    updatePlan(planId: string, dto: UpdatePlanDto): Promise<any>;
    adminAssignPlan(vendorId: string, dto: AssignPlanDto): Promise<{
        plan: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            slug: string;
            solicitudesMensuales: number;
            prioridad: number;
            precioMensual: number;
            precioAnual: number;
            comisionPorcentaje: number;
            visibleEnApp: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        vendorId: string;
        updatedAt: Date;
        planId: string;
        estado: string;
        fechaAsignacion: Date;
        fechaExpiracion: Date | null;
        fechaGracia: Date | null;
    }>;
    listVendorsWithPlans(limit?: string, offset?: string): Promise<{
        items: {
            id: any;
            businessName: any;
            user: any;
            isAvailable: any;
            createdAt: any;
            currentPlan: {
                name: any;
                slug: any;
                estado: any;
                fechaExpiracion: any;
            } | null;
        }[];
        total: number;
    }>;
    checkExpirations(): Promise<{
        movedToGrace: number;
        downgradedToGratuito: number;
    }>;
    resetMonthlyCounts(): Promise<{
        success: boolean;
    }>;
}
