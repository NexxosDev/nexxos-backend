"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: '*' });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const swaggerPath = 'api-docs';
    app.use(`/${swaggerPath}`, (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        next();
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NEXXOS API')
        .setDescription('API para la plataforma de repuestos automotrices NEXXOS')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup(swaggerPath, app, document, {
        customSiteTitle: 'NEXXOS API',
        customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #1a1a2e; font-size: 2em; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 6px; }
      .swagger-ui .opblock-tag { font-size: 1.1em; border-bottom: 2px solid #e9ecef; }
      .swagger-ui .btn.authorize { background: #1a1a2e; color: white; border-radius: 6px; }
      .swagger-ui .btn.authorize svg { fill: white; }
    `,
    });
    await app.listen(3000);
    logger.log('NEXXOS API running on port 3000');
    logger.log(`Swagger docs at http://localhost:3000/${swaggerPath}`);
}
bootstrap();
//# sourceMappingURL=main.js.map