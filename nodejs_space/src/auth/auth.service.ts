import { Injectable, ConflictException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailVerificationService } from './email-verification.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    if (dto.role === 'VENDEDOR' && !dto.vendor) {
      throw new BadRequestException('Vendor data is required for VENDEDOR role');
    }

    const role = await this.prisma.role.findUnique({ where: { name: dto.role } });
    if (!role) throw new BadRequestException('Invalid role');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Modo de desarrollo: auto-verificar email si SKIP_EMAIL_VERIFICATION=true
    const skipEmailVerification = this.configService.get<string>('SKIP_EMAIL_VERIFICATION') === 'true';
    const emailVerified = skipEmailVerification;

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
        documentId: dto.documentId,
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

    // Enviar email de verificación solo si NO estamos en modo desarrollo
    if (!skipEmailVerification) {
      try {
        await this.emailVerificationService.sendVerificationEmail(user.id);
        this.logger.log(`Verification email sent to ${user.email}`);
      } catch (error) {
        this.logger.error(`Failed to send verification email: ${error.message}`);
        // Don't fail registration if email fails
      }
    } else {
      this.logger.log(`[DEV MODE] Email verification skipped for ${user.email}`);
    }

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
        roles: user.userRoles.map((ur: any) => ur.role.name),
        hasVendorProfile: !!user.vendor,
      },
    };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
