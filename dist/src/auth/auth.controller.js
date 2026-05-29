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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const password_reset_service_1 = require("./password-reset.service");
const signup_dto_1 = require("./dto/signup.dto");
const login_dto_1 = require("./dto/login.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const verify_reset_code_dto_1 = require("./dto/verify-reset-code.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const upgrade_to_vendor_dto_1 = require("./dto/upgrade-to-vendor.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const current_user_decorator_1 = require("./current-user.decorator");
let AuthController = class AuthController {
    authService;
    passwordResetService;
    constructor(authService, passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }
    signup(dto) {
        return this.authService.signup(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    getMe(userId) {
        return this.authService.getMe(userId);
    }
    async forgotPassword(dto) {
        const result = await this.passwordResetService.sendResetCode(dto.email);
        return {
            success: true,
            expiresIn: result.expiresIn,
            message: 'Si el email existe, recibirás un código de 6 dígitos para restablecer tu contraseña.',
        };
    }
    async verifyResetCode(dto) {
        const result = await this.passwordResetService.verifyResetCode(dto.email, dto.code);
        return { success: true, verified: result.verified };
    }
    async resetPassword(dto) {
        await this.passwordResetService.resetPasswordWithCode(dto.email, dto.code, dto.newPassword);
        return {
            success: true,
            message: 'Contraseña restablecida exitosamente.',
        };
    }
    upgradeToVendor(userId, dto) {
        return this.authService.upgradeToVendor(userId, dto);
    }
    deleteAccount(userId) {
        return this.authService.deleteAccount(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user (CLIENTE or VENDEDOR)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_dto_1.SignupDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('auth/me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('auth/forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Send 6-digit password reset code to email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('auth/verify-reset-code'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify the 6-digit password reset code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_reset_code_dto_1.VerifyResetCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyResetCode", null);
__decorate([
    (0, common_1.Post)('auth/reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using verified code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('auth/upgrade-to-vendor'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upgrade existing client to vendor (creates vendor profile)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upgrade_to_vendor_dto_1.UpgradeToVendorDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "upgradeToVendor", null);
__decorate([
    (0, common_1.Delete)('auth/account'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete account — anonymizes data, soft deletes user, revokes tokens' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "deleteAccount", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        password_reset_service_1.PasswordResetService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map