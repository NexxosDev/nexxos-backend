import { Injectable, ConflictException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailVerificationService } from './email-verification.service';
import { RegistrationCodeService } from './registration-code.service';
import { formatCedula } from '../lib/cedula';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly registrationCodeService: RegistrationCodeService,
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Este correo electrónico ya está registrado.');

    // Normalize and validate cédula
    const normalizedDocId = formatCedula(dto.documentId);
    if (!normalizedDocId || !/^V-\d{6,8}$/.test(normalizedDocId)) {
      throw new BadRequestException('Formato de cédula inválido. Debe ser V-12345678');
    }

    // Check for duplicate cédula
    const existingDoc = await this.prisma.user.findFirst({
      where: { documentId: normalizedDocId },
    });
    if (existingDoc) {
      throw new ConflictException(
        'Esta cédula ya está registrada. Si ya tienes una cuenta, inicia sesión. Si olvidaste tus datos, usa "Recuperar contraseña".',
      );
    }

    if (dto.role === 'VENDEDOR' && !dto.vendor) {
      throw new BadRequestException('Vendor data is required for VENDEDOR role');
    }

    // Check pre-registration email verification
    const skipEmailVerification = this.configService.get<string>('SKIP_EMAIL_VERIFICATION') === 'true';
    const preVerified = await this.registrationCodeService.isEmailVerified(dto.email);
    if (!preVerified && !skipEmailVerification) {
      throw new BadRequestException('Debes verificar tu correo electrónico antes de registrarte.');
    }
    const emailVerified = preVerified || skipEmailVerification;

    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new BadRequestException('Invalid role');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Vendedores también obtienen rol CLIENTE para poder crear solicitudes
    const rolesToAssign: { roleId: string }[] = [{ roleId: role.id }];
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
      // Assign default plan (Beta or Gratuito depending on cutoff date)
      await this.plansService.assignDefaultPlan(vendor.id);
    }

    // Email was already pre-verified via registration code, no need to send post-signup verification
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
        roles: user.userRoles.map((ur: any) => ur.role.name),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    if (user.deletedAt) throw new UnauthorizedException('Esta cuenta ha sido eliminada');
    if (!user.isActive) throw new UnauthorizedException('Tu cuenta ha sido desactivada');

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
        roles: user.userRoles.map((ur: any) => ur.role.name),
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } }, vendor: true },
    });
    if (!user) throw new UnauthorizedException();
    let profileImageUrl: string | null = null;
    if (user.profileImageUrl) {
      try {
        const { getFileUrl } = await import('../lib/s3.js');
        const isPublic = user.profileImageUrl.includes('/public/');
        profileImageUrl = await getFileUrl(user.profileImageUrl, isPublic, this.prisma);
      } catch { }
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
        roles: user.userRoles.map((ur: any) => ur.role.name),
        hasVendorProfile: !!user.vendor,
      },
    };
  }

  async upgradeToVendor(userId: string, dto: import('./dto/upgrade-to-vendor.dto').UpgradeToVendorDto) {
    this.logger.log(`[upgradeToVendor] Starting for userId=${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } }, vendor: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.vendor) throw new ConflictException('Ya tienes un perfil de vendedor.');

    const vendorRole = await this.prisma.role.findUnique({ where: { name: 'VENDEDOR' } });
    if (!vendorRole) throw new BadRequestException('Vendor role not configured');

    const hasVendorRole = user.userRoles.some((ur: any) => ur.role.name === 'VENDEDOR');

    const vendor = await this.prisma.$transaction(async (tx: any) => {
      if (!hasVendorRole) {
        await tx.userRole.create({ data: { userId: user.id, roleId: vendorRole.id } });
      }
      const v = await tx.vendor.create({
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
      await tx.vendorMetrics.create({ data: { vendorId: v.id } });
      return v;
    });

    // Assign default plan OUTSIDE transaction to avoid deadlock
    await this.plansService.assignDefaultPlan(vendor.id);

    // Return updated user info
    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } }, vendor: true },
    });

    this.logger.log(`User ${user.email} upgraded to VENDEDOR`);

    return {
      success: true,
      user: {
        id: updated!.id,
        email: updated!.email,
        name: updated!.name,
        firstName: updated!.firstName,
        lastName: updated!.lastName,
        emailVerified: updated!.emailVerified,
        roles: updated!.userRoles.map((ur: any) => ur.role.name),
        hasVendorProfile: true,
      },
    };
  }

  // ── Delete account (soft delete + anonymize) ──
  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vendor: true },
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (user.deletedAt) throw new BadRequestException('Esta cuenta ya fue eliminada');

    const vendor = user.vendor;

    // If vendor: block if they have active request matches (PENDING not responded/declined)
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
        throw new BadRequestException(
          `Debes responder o declinar tus ${activeMatches} solicitud(es) activa(s) antes de eliminar tu cuenta.`,
        );
      }
    }

    // Auto-close client's open requests
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

    // Collect S3 keys to delete
    const s3KeysToDelete: string[] = [];
    if (user.profileImageUrl) {
      const key = this.extractS3Key(user.profileImageUrl);
      if (key) s3KeysToDelete.push(key);
    }
    if (vendor) {
      for (const field of ['logoUrl', 'documentImageUrl', 'personalDocUrl', 'selfieUrl', 'facadeImageUrl'] as const) {
        const url = vendor[field];
        if (url) {
          const key = this.extractS3Key(url);
          if (key) s3KeysToDelete.push(key);
        }
      }
    }

    // Anonymize user data
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

    // Anonymize vendor data if exists
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

      // Cancel active subscriptions
      await this.prisma.vendorSubscription.updateMany({
        where: { vendorId: vendor.id, estado: { in: ['ACTIVE', 'GRACE_PERIOD'] } },
        data: { estado: 'CANCELLED' },
      });
    }

    // Delete push tokens
    await this.prisma.pushToken.deleteMany({ where: { userId } });

    // Delete email verification & password reset tokens
    await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } });

    // Delete S3 files (best effort)
    for (const key of s3KeysToDelete) {
      try {
        const { deleteFile } = await import('../lib/s3.js');
        await deleteFile(key, this.prisma);
        this.logger.log(`Deleted S3 file: ${key}`);
      } catch (e) {
        this.logger.warn(`Failed to delete S3 file ${key}: ${(e as Error)?.message}`);
      }
    }

    this.logger.log(`Account deleted (anonymized) for user ${userId}`);
    return { success: true, message: 'Cuenta eliminada exitosamente' };
  }

  // Extract S3 key from a URL or cloud_storage_path
  private extractS3Key(url: string): string | null {
    if (!url) return null;
    // If it's already a key (starts with folder prefix or uploads/)
    if (!url.startsWith('http')) return url;
    // Extract key from S3 URL: https://bucket.s3.region.amazonaws.com/KEY
    try {
      const parsed = new URL(url);
      return parsed.pathname.substring(1); // remove leading /
    } catch {
      return null;
    }
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
