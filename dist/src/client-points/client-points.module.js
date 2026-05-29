"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPointsModule = void 0;
const common_1 = require("@nestjs/common");
const client_points_service_1 = require("./client-points.service");
const client_points_controller_1 = require("./client-points.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const notification_module_1 = require("../notification/notification.module");
let ClientPointsModule = class ClientPointsModule {
};
exports.ClientPointsModule = ClientPointsModule;
exports.ClientPointsModule = ClientPointsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notification_module_1.NotificationModule],
        controllers: [client_points_controller_1.ClientPointsController],
        providers: [client_points_service_1.ClientPointsService],
        exports: [client_points_service_1.ClientPointsService],
    })
], ClientPointsModule);
//# sourceMappingURL=client-points.module.js.map