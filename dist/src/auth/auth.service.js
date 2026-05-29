"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const email_verification_service_1 = require("./email-verification.service");
const registration_code_service_1 = require("./registration-code.service");
const cedula_1 = require("../lib/cedula");
const plans_service_1 = require("../plans/plans.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    emailVerificationService;
    registrationCodeService;
    configService;
    plansService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, emailVerificationService, registrationCodeService, configService, plansService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailVerificationService = emailVerificationService;
        this.registrationCodeService = registrationCodeService;
        this.configService = configService;
        this.plansService = plansService;
    }
    async signup(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Este correo electrónico ya está registrado.');
        const normalizedDocId = (0, cedula_1.formatCedula)(dto.documentId);
        if (!normalizedDocId || !/^V-\d{6,8}$/.test(normalizedDocId)) {
            throw new common_1.BadRequestException('Formato de cédula inválido. Debe ser V-12345678');
        }
        const existingDoc = await this.prisma.user.findFirst({
            where: { documentId: normalizedDocId },
        });
        if (existingDoc) {
            throw new common_1.ConflictException('Esta cédula ya está registrada. Si ya tienes una cuenta, inicia sesión. Si olvidaste tus datos, usa "Recuperar contraseña".');
        }
        if (dto.role === 'VENDEDOR' && !dto.vendor) {
            throw new common_1.BadRequestException('Vendor data is required for VENDEDOR role');
        }
        const skipEmailVerification = this.configService.get('SKIP_EMAIL_VERIFICATION') === 'true';
        const preVerified = await this.registrationCodeService.isEmailVerified(dto.email);
        if (!preVerified && !skipEmailVerification) {
            throw new common_1.BadRequestException('Debes verificar tu correo electrónico antes de registrarte.');
        }
        const emailVerified = preVerified || skipEmailVerification;
        const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
        if (!role)
            throw new common_1.BadRequestException('Invalid role');
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const rolesToAssign = [{ roleId: role.id }];
        if (dto.role === 'VENDEDOR') {
            const clienteRole = await this.prisma.role.findUnique({ where: { name: 'CLIENTE' } });
            if (clienteRole) {
                rolesToAssign.push({ roleId: clienteRole.id });
            }
        }
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: dto.firstName,
                lastName: dto.lastName,
                name: `${dto.firstName} ${dto.lastName}`,
                phone: dto.phone,
                documentId: normalizedDocId,
                emailVerified,
                userRoles: { create: rolesToAssign },
            },
            include: { userRoles: { include: { role: true } } },
        });
        if (dto.role === 'VENDEDOR' && dto.vendor) {
            const v = dto.vendor;
            const vendor = await this.prisma.vendor.create({
                data: {
                    userId: user.id,
                    businessName: v.businessName,
                    rif: v.rif,
                    country: v.country || null,
                    city: v.city || null,
                    state: v.state || null,
                    municipality: v.municipality || null,
                    parish: v.parish || null,
                    street: v.street || null,
                    postalCode: v.postalCode || null,
                    latitude: v.latitude || null,
                    longitude: v.longitude || null,
                    referencePoint: v.referencePoint || null,
                    fullAddress: v.fullAddress || null,
                    logoUrl: v.logoPath || null,
                    documentImageUrl: v.documentImagePath || null,
                    personalDocUrl: v.personalDocPath || null,
                    selfieUrl: v.selfiePath || null,
                    facadeImageUrl: v.facadeImagePath || null,
                    identityVerified: !!v.identityVerified,
                    identityVerifiedAt: v.identityVerified ? new Date() : null,
                    vendorVehicleModels: {
                        create: v.vehicleModelIds.map((id) => ({ vehicleModelId: id })),
                    },
                    vendorPartSubcategories: {
                        create: v.partSubcategoryIds.map((id) => ({ partSubcategoryId: id })),
                    },
                },
            });
            await this.prisma.vendorMetrics.create({ data: { vendorId: vendor.id } });
            await this.plansService.assignDefaultPlan(vendor.id);
        }
        this.logger.log(`Email pre-verified for ${user.email}, skipping post-signup verification`);
        const token = this.generateToken(user.id, user.email);
        this.logger.log(`User registered: ${user.email}`);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                roles: user.userRoles.map((ur) => ur.role.name),
            },
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { userRoles: { include: { role: true } } },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        if (user.deletedAt)
            throw new common_1.UnauthorizedException('Esta cuenta ha sido eliminada');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('Tu cuenta ha sido desactivada');
        const token = this.generateToken(user.id, user.email);
        this.logger.log(`User logged in: ${user.email}`);
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                emailVerified: user.emailVerified,
                roles: user.userRoles.map((ur) => ur.role.name),
            },
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } }, vendor: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        let profileImageUrl = null;
        if (user.profileImageUrl) {
            try {
                const { getFileUrl } = await import('../lib/s3.js');
                const isPublic = user.profileImageUrl.includes('/public/');
                profileImageUrl = await getFileUrl(user.profileImageUrl, isPublic);
            }
            catch { }
        }
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                documentId: user.documentId,
                emailVerified: user.emailVerified,
                profileImageUrl,
                roles: user.userRoles.map((ur) => ur.role.name),
                hasVendorProfile: !!user.vendor,
            },
        };
    }
    async upgradeToVendor(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } }, vendor: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        if (user.vendor)
            throw new common_1.ConflictException('Ya tienes un perfil de vendedor.');
        const vendorRole = await this.prisma.role.findUnique({ where: { name: 'VENDEDOR' } });
        if (!vendorRole)
            throw new common_1.BadRequestException('Vendor role not configured');
        const hasVendorRole = user.userRoles.some((ur) => ur.role.name === 'VENDEDOR');
        await this.prisma.$transaction(async (tx) => {
            if (!hasVendorRole) {
                await tx.userRole.create({ data: { userId: user.id, roleId: vendorRole.id } });
            }
            const vendor = await tx.vendor.create({
                data: {
                    userId: user.id,
                    businessName: dto.businessName,
                    rif: dto.rif,
                    country: dto.country || null,
                    city: dto.city || null,
                    state: dto.state || null,
                    municipality: dto.municipality || null,
                    parish: dto.parish || null,
                    street: dto.street || null,
                    postalCode: dto.postalCode || null,
                    latitude: dto.latitude || null,
                    longitude: dto.longitude || null,
                    referencePoint: dto.referencePoint || null,
                    fullAddress: dto.fullAddress || null,
                    logoUrl: dto.logoPath || null,
                    documentImageUrl: dto.documentImagePath || null,
                    personalDocUrl: dto.personalDocPath || null,
                    selfieUrl: dto.selfiePath || null,
                    identityVerified: !!dto.identityVerified,
                    identityVerifiedAt: dto.identityVerified ? new Date() : null,
                    vendorVehicleModels: {
                        create: dto.vehicleModelIds.map((id) => ({ vehicleModelId: id })),
                    },
                    vendorPartSubcategories: {
                        create: dto.partSubcategoryIds.map((id) => ({ partSubcategoryId: id })),
                    },
                },
            });
            await tx.vendorMetrics.create({ data: { vendorId: vendor.id } });
            await this.plansService.assignDefaultPlan(vendor.id);
        });
        const updated = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } }, vendor: true },
        });
        this.logger.log(`User ${user.email} upgraded to VENDEDOR`);
        return {
            success: true,
            user: {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                firstName: updated.firstName,
                lastName: updated.lastName,
                emailVerified: updated.emailVerified,
                roles: updated.userRoles.map((ur) => ur.role.name),
                hasVendorProfile: true,
            },
        };
    }
    async deleteAccount(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { vendor: true },
        });
        if (!user)
            throw new common_1.BadRequestException('Usuario no encontrado');
        if (user.deletedAt)
            throw new common_1.BadRequestException('Esta cuenta ya fue eliminada');
        const vendor = user.vendor;
        if (vendor) {
            const activeMatches = await this.prisma.requestVendorMatch.count({
                where: {
                    vendorId: vendor.id,
                    responded: false,
                    declined: false,
                    request: { status: 'ABIERTA' },
                },
            });
            if (activeMatches > 0) {
                throw new common_1.BadRequestException(`Debes responder o declinar tus ${activeMatches} solicitud(es) activa(s) antes de eliminar tu cuenta.`);
            }
        }
        const openRequests = await this.prisma.request.findMany({
            where: { clientId: userId, status: 'ABIERTA' },
            select: { id: true },
        });
        if (openRequests.length > 0) {
            await this.prisma.request.updateMany({
                where: { clientId: userId, status: 'ABIERTA' },
                data: { status: 'CERRADA', closedAt: new Date() },
            });
            this.logger.log(`Auto-closed ${openRequests.length} open requests for user ${userId}`);
        }
        const s3KeysToDelete = [];
        if (user.profileImageUrl) {
            const key = this.extractS3Key(user.profileImageUrl);
            if (key)
                s3KeysToDelete.push(key);
        }
        if (vendor) {
            for (const field of ['logoUrl', 'documentImageUrl', 'personalDocUrl', 'selfieUrl', 'facadeImageUrl']) {
                const url = vendor[field];
                if (url) {
                    const key = this.extractS3Key(url);
                    if (key)
                        s3KeysToDelete.push(key);
                }
            }
        }
        const anonSuffix = userId.substring(0, 8);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                email: `deleted_${anonSuffix}@anon.nexxos.app`,
                firstName: 'Usuario',
                lastName: 'Eliminado',
                name: 'Usuario Eliminado',
                phone: '0000000000',
                documentId: `ANON-${anonSuffix}`,
                profileImageUrl: null,
                isActive: false,
                emailVerified: false,
                deletedAt: new Date(),
            },
        });
        if (vendor) {
            await this.prisma.vendor.update({
                where: { id: vendor.id },
                data: {
                    businessName: 'Negocio Eliminado',
                    rif: `ANON-${anonSuffix}`,
                    logoUrl: null,
                    documentImageUrl: null,
                    personalDocUrl: null,
                    selfieUrl: null,
                    facadeImageUrl: null,
                    identityVerified: false,
                    isAvailable: false,
                    latitude: null,
                    longitude: null,
                    street: null,
                    referencePoint: null,
                    fullAddress: null,
                },
            });
            await this.prisma.vendorSubscription.updateMany({
                where: { vendorId: vendor.id, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
                data: { estado: 'CANCELLED' },
            });
        }
        await this.prisma.pushToken.deleteMany({ where: { userId } });
        await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
        await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
        for (const key of s3KeysToDelete) {
            try {
                const { deleteFile } = await import('../lib/s3.js');
                await deleteFile(key);
                this.logger.log(`Deleted S3 file: ${key}`);
            }
            catch (e) {
                this.logger.warn(`Failed to delete S3 file ${key}: ${e?.message}`);
            }
        }
        this.logger.log(`Account deleted (anonymized) for user ${userId}`);
        return { success: true, message: 'Cuenta eliminada exitosamente' };
    }
    extractS3Key(url) {
        if (!url)
            return null;
        if (!url.startsWith('http'))
            return url;
        try {
            const parsed = new URL(url);
            return parsed.pathname.substring(1);
        }
        catch {
            return null;
        }
    }
    generateToken(userId, email) {
        return this.jwtService.sign({ sub: userId, email });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_verification_service_1.EmailVerificationService,
        registration_code_service_1.RegistrationCodeService,
        config_1.ConfigService,
        plans_service_1.PlansService])
], AuthService);
//# sourceMappingURL=auth.service.js.map