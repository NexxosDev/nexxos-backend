import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { timingSafeEqual } from 'crypto';

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

  // Trust the reverse proxy (Render/Cloudflare) so req.ip reflects the real
  // client IP — required for per-IP rate limiting to work correctly.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Increase body size limit to 50MB for base64 image uploads (identity verification)
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '50mb' }));

  // ── M-3: Security headers (helmet) ──
  // Applied to all routes EXCEPT /api-docs, so the Swagger UI can still be
  // embedded in the Abacus preview iframe (helmet's X-Frame-Options: SAMEORIGIN
  // would otherwise block cross-origin framing of the docs).
  // CSP is disabled to avoid breaking Swagger UI inline scripts and the simple
  // web landing/eliminar-cuenta pages; all other protections (HSTS,
  // X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.) stay on.
  const helmetMw = helmet({ contentSecurityPolicy: false });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api-docs' || req.path.startsWith('/api-docs/')) return next();
    return helmetMw(req, res, next);
  });

  // ── M-2: Restrict CORS to known origins ──
  // Native mobile apps (React Native) do NOT send an Origin header, so they are
  // unaffected by CORS. This only constrains browser-based callers. We allow the
  // NEXXOS web domains, Abacus preview domains, and localhost for development.
  // Extra origins can be added via the CORS_EXTRA_ORIGINS env var (comma-separated).
  const extraOrigins = (process.env.CORS_EXTRA_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOriginPatterns: RegExp[] = [
    /^https?:\/\/([a-z0-9-]+\.)*nexxos\.app$/i,
    /^https?:\/\/([a-z0-9-]+\.)*abacusai\.app$/i,
    /^https?:\/\/localhost(:\d+)?$/i,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/i,
  ];
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow non-browser clients (mobile app, curl, server-to-server) which send no Origin.
      if (!origin) return callback(null, true);
      if (extraOrigins.includes(origin)) return callback(null, true);
      if (allowedOriginPatterns.some((re) => re.test(origin))) return callback(null, true);
      logger.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger setup
  const swaggerPath = 'api-docs';

  // ── M-4: Protect Swagger with HTTP Basic Auth in production ──
  // If SWAGGER_USER and SWAGGER_PASSWORD are set (Render/PROD), /api-docs requires
  // Basic Auth. When they are unset (Abacus dev/preview), docs stay open so the
  // platform API tab keeps working.
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPass = process.env.SWAGGER_PASSWORD;
  if (swaggerUser && swaggerPass) {
    const safeEqual = (a: string, b: string) => {
      const ab = Buffer.from(a);
      const bb = Buffer.from(b);
      return ab.length === bb.length && timingSafeEqual(ab, bb);
    };
    app.use(`/${swaggerPath}`, (req: Request, res: Response, next: NextFunction) => {
      const header = req.headers.authorization ?? '';
      if (header.startsWith('Basic ')) {
        const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
        const idx = decoded.indexOf(':');
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        if (safeEqual(u, swaggerUser) && safeEqual(p, swaggerPass)) return next();
      }
      res.setHeader('WWW-Authenticate', 'Basic realm="NEXXOS API Docs"');
      return res.status(401).send('Authentication required');
    });
    logger.log('[Swagger] Basic Auth protection ENABLED for /api-docs');
  }

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
