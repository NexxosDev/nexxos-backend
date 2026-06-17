import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // ── S3 credential diagnostics ──
  const hasAbacusAwsKey = !!process.env.ABACUS_AWS_ACCESS_KEY_ID;
  const hasRefreshLoc = !!process.env.ABACUS_AWS_REFRESH_LOCATION;
  const hasCredFile = (() => { try { require('fs').accessSync('/aws_credentials/.aws/hosted_storage_credential_json'); return true; } catch { return false; } })();
  const hasSharedCreds = !!process.env.AWS_SHARED_CREDENTIALS_FILE;
  logger.log(`[S3 Creds] ABACUS_AWS_ACCESS_KEY_ID: ${hasAbacusAwsKey ? 'YES' : 'NO'}, REFRESH_LOCATION: ${hasRefreshLoc ? 'YES' : 'NO'}, credential_file: ${hasCredFile ? 'EXISTS' : 'MISSING'}, AWS_SHARED_CREDENTIALS_FILE: ${hasSharedCreds ? process.env.AWS_SHARED_CREDENTIALS_FILE : 'NOT SET'}`);

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Increase body size limit to 50MB for base64 image uploads (identity verification)
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger setup
  const swaggerPath = 'api-docs';

  // Prevent caching of swagger docs
  app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('NEXXOS API')
    .setDescription('API para la plataforma de repuestos automotrices NEXXOS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
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
