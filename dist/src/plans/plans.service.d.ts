import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
export declare class PlansService {
    private readonly prisma;
    private readonly notificationService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService, configService: ConfigService);
    private withLegacyFields;
    createPlan(dto: CreatePlanDto): Promise<any>;
    deletePlan(planId: string): Promise<{
        deleted: boolean;
    }>;
    listAllPlans(): Promise<any[]>;
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
    updatePlan(planId: string, dto: UpdatePlanDto): Promise<any>;
    getVendorActivePlan(vendorId: string): Promise<({
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
    }) | null>;
    getMyPlan(userId: string): Promise<{
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
    assignPlanToVendor(vendorId: string, planSlug: string, expirationMonths?: number): Promise<{
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
    assignDefaultPlan(vendorId: string): Promise<void>;
    canReceiveRequests(vendorId: string): Promise<boolean>;
    incrementMonthlyCount(vendorId: string): Promise<number>;
    checkExpirations(): Promise<{
        movedToGrace: number;
        downgradedToGratuito: number;
    }>;
    resetMonthlyCounts(): Promise<{
        success: boolean;
    }>;
    adminAssignPlan(vendorId: string, planSlug: string, expirationMonths?: number): Promise<{
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
    listVendorsWithPlans(limit?: number, offset?: number): Promise<{
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
}
