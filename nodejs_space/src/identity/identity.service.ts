import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getConfig } from '../lib/config-helper';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /** Download an image from URL and return as data:image/jpeg;base64,... */
  private async toBase64DataUrl(imageUrl: string): Promise<string> {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers?.get?.('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (err) {
      this.logger.error(`Failed to convert image to base64: ${(err as Error)?.message}`);
      throw new BadRequestException('No se pudo descargar una de las imágenes para verificación.');
    }
  }

  async verifyIdentity(
    documentImageUrl: string,
    selfieNeutralUrl: string,
    selfieSmileUrl: string,
    selfieTurnUrl: string,
  ) {
    const apiKey = await getConfig('API_LLM_KEY', this.prisma);
    if (!apiKey) throw new BadRequestException('LLM API not configured');

    const llmEndpoint = (await getConfig('API_LLM_ENDPOINT', this.prisma)) || undefined;

    this.logger.log(`Verifying identity — converting images to base64...`);

    // Convert all images to base64 data URLs (Abacus AI API requires this format)
    const [docB64, neutralB64, smileB64, turnB64] = await Promise.all([
      this.toBase64DataUrl(documentImageUrl),
      this.toBase64DataUrl(selfieNeutralUrl),
      this.toBase64DataUrl(selfieSmileUrl),
      this.toBase64DataUrl(selfieTurnUrl),
    ]);

    this.logger.log(`Images converted to base64 successfully`);

    // Step 1: Liveness check — verify the 3 selfies show a real person performing actions
    const livenessResult = await this.callLLM(apiKey, [
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analiza estas 3 fotos de selfie tomadas en secuencia. Verifica:\n1. Las 3 fotos muestran a la MISMA persona\n2. Foto 1: rostro neutro mirando de frente\n3. Foto 2: la persona está SONRIENDO (expresión diferente a foto 1)\n4. Foto 3: la persona giró la cabeza hacia un lado (pose diferente a foto 1)\n\nEsto es una prueba de vida (liveness). Si las 3 fotos son idénticas o parecen una foto estática repetida, falla la prueba.\n\nResponde SOLO con JSON válido:\n{"liveness": true/false, "reason": "explicación breve"}` },
          { type: 'image_url', image_url: { url: neutralB64 } },
          { type: 'image_url', image_url: { url: smileB64 } },
          { type: 'image_url', image_url: { url: turnB64 } },
        ],
      },
    ], llmEndpoint);

    this.logger.log(`Liveness result: ${JSON.stringify(livenessResult)}`);

    if (!livenessResult?.liveness) {
      return {
        match: false,
        liveness: false,
        confidence: 'n/a',
        reason: livenessResult?.reason ?? 'No se pudo verificar la prueba de vida. Las fotos no muestran las acciones solicitadas.',
      };
    }

    // Step 2: Face match — compare document photo vs neutral selfie
    const matchResult = await this.callLLM(apiKey, [
      {
        role: 'user',
        content: [
          { type: 'text', text: `Compara estas 2 imágenes:\n- Imagen 1: Un documento de identidad (cédula venezolana u otro documento oficial con foto)\n- Imagen 2: Un selfie de una persona\n\n¿La persona del selfie es la MISMA persona que aparece en la foto del documento de identidad?\n\nConsidera que la foto del documento puede ser más antigua, con diferente iluminación, ángulo, o la persona puede tener cambios menores (pelo, barba, lentes).\n\nResponde SOLO con JSON válido:\n{"match": true/false, "confidence": "alta"/"media"/"baja", "reason": "explicación breve"}` },
          { type: 'image_url', image_url: { url: docB64 } },
          { type: 'image_url', image_url: { url: neutralB64 } },
        ],
      },
    ], llmEndpoint);

    this.logger.log(`Match result: ${JSON.stringify(matchResult)}`);

    const isMatch = !!matchResult?.match;

    return {
      match: isMatch,
      liveness: true,
      confidence: matchResult?.confidence ?? 'baja',
      reason: matchResult?.reason ?? 'No se pudo determinar.',
    };
  }

  private async callLLM(apiKey: string, messages: any[], endpoint?: string): Promise<any> {
    const baseUrl = endpoint || 'https://apps.abacus.ai/v1/chat/completions';
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages,
          response_format: { type: 'json_object' },
          stream: false,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`LLM API error: ${res.status} ${errText}`);
        throw new Error(`LLM API returned ${res.status}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? '{}';
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('LLM call failed', err);
      throw new BadRequestException('Error al verificar identidad. Intenta de nuevo.');
    }
  }
}
