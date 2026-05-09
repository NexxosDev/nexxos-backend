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
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

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

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
