"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const s3_1 = require("../lib/s3");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: { include: { role: true } } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        let profileImageUrl = null;
        if (user.profileImageUrl) {
            const isPublic = user.profileImageUrl.includes('/public/');
            profileImageUrl = await (0, s3_1.getFileUrl)(user.profileImageUrl, isPublic);
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            documentId: user.documentId,
            profileImageUrl,
            roles: user.userRoles.map((ur) => ur.role.name),
        };
    }
    async updateProfile(userId, dto) {
        const data = {};
        if (dto.firstName !== undefined)
            data.firstName = dto.firstName;
        if (dto.lastName !== undefined)
            data.lastName = dto.lastName;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.profileImagePath !== undefined)
            data.profileImageUrl = dto.profileImagePath;
        if (dto.firstName || dto.lastName) {
            const current = await this.prisma.user.findUnique({ where: { id: userId } });
            data.name = `${dto.firstName ?? current.firstName} ${dto.lastName ?? current.lastName}`;
        }
        const user = await this.prisma.user.update({ where: { id: userId }, data });
        let profileImageUrl = null;
        if (user.profileImageUrl) {
            const isPublic = user.profileImageUrl.includes('/public/');
            profileImageUrl = await (0, s3_1.getFileUrl)(user.profileImageUrl, isPublic);
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map