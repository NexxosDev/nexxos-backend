"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const catalog_module_1 = require("./catalog/catalog.module");
const vendor_module_1 = require("./vendor/vendor.module");
const requests_module_1 = require("./requests/requests.module");
const chat_module_1 = require("./chat/chat.module");
const upload_module_1 = require("./upload/upload.module");
const notification_module_1 = require("./notification/notification.module");
const identity_module_1 = require("./identity/identity.module");
const plans_module_1 = require("./plans/plans.module");
const client_points_module_1 = require("./client-points/client-points.module");
const vehicles_module_1 = require("./vehicles/vehicles.module");
const legal_module_1 = require("./legal/legal.module");
const suggestions_module_1 = require("./suggestions/suggestions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            catalog_module_1.CatalogModule,
            requests_module_1.RequestsModule,
            vendor_module_1.VendorModule,
            chat_module_1.ChatModule,
            upload_module_1.UploadModule,
            notification_module_1.NotificationModule,
            identity_module_1.IdentityModule,
            plans_module_1.PlansModule,
            client_points_module_1.ClientPointsModule,
            vehicles_module_1.VehiclesModule,
            legal_module_1.LegalModule,
            suggestions_module_1.SuggestionsModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map