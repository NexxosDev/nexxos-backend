import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    let profileImageUrl: string | null = null;
    if (user.profileImageUrl) {
      const isPublic = user.profileImageUrl.includes('/public/');
      profileImageUrl = await getFileUrl(user.profileImageUrl, isPublic, this.prisma);
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      documentId: user.documentId,
      profileImageUrl,
      roles: user.userRoles.map((ur: any) => ur.role.name),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, any> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.profileImagePath !== undefined) data.profileImageUrl = dto.profileImagePath;
    if (dto.firstName || dto.lastName) {
      const current = await this.prisma.user.findUnique({ where: { id: userId } });
      data.name = `${dto.firstName ?? current!.firstName} ${dto.lastName ?? current!.lastName}`;
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data });
    let profileImageUrl: string | null = null;
    if (user.profileImageUrl) {
      const isPublic = user.profileImageUrl.includes('/public/');
      profileImageUrl = await getFileUrl(user.profileImageUrl, isPublic, this.prisma);
    }
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImageUrl,
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
