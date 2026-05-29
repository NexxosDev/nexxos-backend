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
exports.ReorderQuickRepliesDto = exports.UpdateQuickReplyDto = exports.CreateQuickReplyDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateQuickReplyDto {
    messageText;
}
exports.CreateQuickReplyDto = CreateQuickReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sí, lo tengo disponible' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateQuickReplyDto.prototype, "messageText", void 0);
class UpdateQuickReplyDto {
    messageText;
}
exports.UpdateQuickReplyDto = UpdateQuickReplyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Sí, lo tengo disponible' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateQuickReplyDto.prototype, "messageText", void 0);
class ReorderItemDto {
    id;
    order;
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReorderItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ReorderItemDto.prototype, "order", void 0);
class ReorderQuickRepliesDto {
    items;
}
exports.ReorderQuickRepliesDto = ReorderQuickRepliesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ReorderItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReorderItemDto),
    __metadata("design:type", Array)
], ReorderQuickRepliesDto.prototype, "items", void 0);
//# sourceMappingURL=quick-reply.dto.js.map