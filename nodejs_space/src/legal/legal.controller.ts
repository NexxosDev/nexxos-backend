import { Controller, Get, Res, Logger } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { LegalService } from './legal.service';

const PAGE_STYLE = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0A; color: #E0E0E0; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 32px 20px 60px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo h1 { font-size: 28px; font-weight: 800; color: #FFC107; letter-spacing: 2px; }
    .logo .sub { font-size: 13px; color: #999; margin-top: 4px; }
    h2 { font-size: 20px; font-weight: 700; color: #FFC107; margin-top: 32px; margin-bottom: 12px; }
    h3 { font-size: 16px; font-weight: 600; color: #E0E0E0; margin-top: 20px; margin-bottom: 8px; }
    p, li { font-size: 15px; color: #CCC; margin-bottom: 10px; }
    ul, ol { padding-left: 24px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    strong { color: #E0E0E0; }
    .date { text-align: center; font-size: 13px; color: #888; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #333; padding: 10px 12px; font-size: 14px; text-align: left; }
    th { background: #1A1A1A; color: #FFC107; font-weight: 600; }
    td { color: #CCC; }
    a { color: #FFC107; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #333; font-size: 13px; color: #666; }
    @media (max-width: 600px) { .container { padding: 20px 16px 40px; } h2 { font-size: 18px; } }
  </style>
`;

@Controller()
export class LegalHtmlController {
  private readonly logger = new Logger(LegalHtmlController.name);

  constructor(private readonly legalService: LegalService) {}

  @Get('terminos')
  @ApiExcludeEndpoint()
  async getTerminos(@Res() res: Response) {
    try {
      const doc = await this.legalService.findByKey('terminos');
      res.type('html').send(this.wrapHtml(doc?.title ?? 'Términos y Condiciones', doc?.content ?? ''));
    } catch {
      res.type('html').send(this.wrapHtml('Términos y Condiciones', '<p>Documento no disponible.</p>'));
    }
  }

  @Get('privacidad')
  @ApiExcludeEndpoint()
  async getPrivacidad(@Res() res: Response) {
    try {
      const doc = await this.legalService.findByKey('privacidad');
      res.type('html').send(this.wrapHtml(doc?.title ?? 'Política de Privacidad', doc?.content ?? ''));
    } catch {
      res.type('html').send(this.wrapHtml('Política de Privacidad', '<p>Documento no disponible.</p>'));
    }
  }

  @Get('faq')
  @ApiExcludeEndpoint()
  async getFaq(@Res() res: Response) {
    try {
      const doc = await this.legalService.findByKey('faq');
      const data = JSON.parse(doc?.content ?? '{"categories":[]}');
      const categories = data?.categories ?? [];
      let html = '';
      for (const cat of categories) {
        html += `<h2>${cat?.label ?? ''}</h2>`;
        for (const item of (cat?.items ?? [])) {
          html += `<details><summary style="cursor:pointer;padding:10px 0;font-weight:600;font-size:15px;color:#E0E0E0;border-bottom:1px solid #333;">${item?.q ?? ''}</summary><p style="padding:10px 0 16px;color:#CCC;line-height:1.7;">${(item?.a ?? '').replace(/\\n/g, '<br>')}</p></details>`;
        }
      }
      res.type('html').send(this.wrapHtml(doc?.title ?? 'Preguntas Frecuentes', html));
    } catch {
      res.type('html').send(this.wrapHtml('Preguntas Frecuentes', '<p>Documento no disponible.</p>'));
    }
  }

  @Get('sobre-nosotros')
  @ApiExcludeEndpoint()
  async getSobreNosotros(@Res() res: Response) {
    try {
      const doc = await this.legalService.findByKey('sobre-nosotros');
      res.type('html').send(this.wrapHtml(doc?.title ?? 'Sobre Nosotros', doc?.content ?? ''));
    } catch {
      res.type('html').send(this.wrapHtml('Sobre Nosotros', '<p>Documento no disponible.</p>'));
    }
  }

  private wrapHtml(title: string, content: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — NEXXOS</title>${PAGE_STYLE}</head><body><div class="container">
<div class="logo"><h1>NEXXOS</h1><div class="sub">Conectando soluciones, acercando oportunidades</div></div>
${content}
<div class="footer">© 2026 NEXXOS. Todos los derechos reservados.</div>
</div></body></html>`;
  }
}
