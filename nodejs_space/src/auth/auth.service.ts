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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly registrationCodeService: RegistrationCodeService,
    private readonly configService: ConfigService,
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
        profileImageUrl = await getFileUrl(user.profileImageUrl, isPublic);
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } }, vendor: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.vendor) throw new ConflictException('Ya tienes un perfil de vendedor.');

    const vendorRole = await this.prisma.role.findUnique({ where: { name: 'VENDEDOR' } });
    if (!vendorRole) throw new BadRequestException('Vendor role not configured');

    const hasVendorRole = user.userRoles.some((ur: any) => ur.role.name === 'VENDEDOR');

    await this.prisma.$transaction(async (tx: any) => {
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
    });

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

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
