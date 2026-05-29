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
exports.RegistrationCodeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const registration_code_service_1 = require("./registration-code.service");
class SendCodeDto {
    email;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendCodeDto.prototype, "email", void 0);
class VerifyCodeDto {
    email;
    code;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "code", void 0);
let RegistrationCodeController = class RegistrationCodeController {
    registrationCodeService;
    constructor(registrationCodeService) {
        this.registrationCodeService = registrationCodeService;
    }
    async sendCode(dto) {
        return this.registrationCodeService.sendCode(dto.email);
    }
    async verifyCode(dto) {
        return this.registrationCodeService.verifyCode(dto.email, dto.code);
    }
};
exports.RegistrationCodeController = RegistrationCodeController;
__decorate([
    (0, common_1.Post)('send-code'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Send 6-digit verification code to email (pre-registration)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendCodeDto]),
    __metadata("design:returntype", Promise)
], RegistrationCodeController.prototype, "sendCode", null);
__decorate([
    (0, common_1.Post)('verify-code'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Verify the 6-digit code for email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyCodeDto]),
    __metadata("design:returntype", Promise)
], RegistrationCodeController.prototype, "verifyCode", null);
exports.RegistrationCodeController = RegistrationCodeController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [registration_code_service_1.RegistrationCodeService])
], RegistrationCodeController);
//# sourceMappingURL=registration-code.controller.js.map