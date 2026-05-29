import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async verifyIdentity(
    documentImageUrl: string,
    selfieNeutralUrl: string,
    selfieSmileUrl: string,
    selfieTurnUrl: string,
  ) {
    const apiKey = this.config.get<string>('ABACUSAI_API_KEY');
    if (!apiKey) throw new BadRequestException('LLM API not configured');

    // Step 1: Liveness check — verify the 3 selfies show a real person performing actions
    const livenessResult = await this.callLLM(apiKey, [
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analiza estas 3 fotos de selfie tomadas en secuencia. Verifica:\n1. Las 3 fotos muestran a la MISMA persona\n2. Foto 1: rostro neutro mirando de frente\n3. Foto 2: la persona está SONRIENDO (expresión diferente a foto 1)\n4. Foto 3: la persona giró la cabeza hacia un lado (pose diferente a foto 1)\n\nEsto es una prueba de vida (liveness). Si las 3 fotos son idénticas o parecen una foto estática repetida, falla la prueba.\n\nResponde SOLO con JSON válido:\n{"liveness": true/false, "reason": "explicación breve"}` },
          { type: 'image_url', image_url: { url: selfieNeutralUrl } },
          { type: 'image_url', image_url: { url: selfieSmileUrl } },
          { type: 'image_url', image_url: { url: selfieTurnUrl } },
        ],
      },
    ]);

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
          { type: 'image_url', image_url: { url: documentImageUrl } },
          { type: 'image_url', image_url: { url: selfieNeutralUrl } },
        ],
      },
    ]);

    this.logger.log(`Match result: ${JSON.stringify(matchResult)}`);

    const isMatch = !!matchResult?.match;

    return {
      match: isMatch,
      liveness: true,
      confidence: matchResult?.confidence ?? 'baja',
      reason: matchResult?.reason ?? 'No se pudo determinar.',
    };
  }

  private async callLLM(apiKey: string, messages: any[]): Promise<any> {
    try {
      const res = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
