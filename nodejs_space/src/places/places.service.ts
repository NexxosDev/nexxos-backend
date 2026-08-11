import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AutocompleteDto, PlaceDetailsDto } from './dto/places.dto';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_BASE = 'https://places.googleapis.com/v1/places';

// Restriccin fija: solo Venezuela.
const REGION_CODES = ['ve'];
// Radio del sesgo dinmico alrededor de la ubicacin del usuario (metros).
const BIAS_RADIUS_METERS = 40000;

export interface AutocompletePrediction {
  placeId: string;
  label: string;
  primaryText: string;
  secondaryText: string;
}

// Rate-limit suave en memoria por usuario (guarda blando; las cuotas duras viven en Google Cloud Console).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;
const rateMap = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);

  private getApiKey(): string {
    const key = process.env.GOOGLE_PLACES_API_KEY ?? '';
    if (!key) {
      this.logger.error('GOOGLE_PLACES_API_KEY no está configurada en el entorno');
      throw new HttpException('Servicio de búsqueda no disponible', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return key;
  }

  private checkRate(userId: string) {
    const now = Date.now();
    const entry = rateMap.get(userId);
    if (!entry || now > entry.resetAt) {
      rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return;
    }
    entry.count += 1;
    if (entry.count > RATE_MAX) {
      throw new HttpException('Demasiadas búsquedas, intenta en un momento', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async autocomplete(userId: string, dto: AutocompleteDto): Promise<AutocompletePrediction[]> {
    const input = dto?.input?.trim?.() ?? '';
    if (input.length < 3) return [];
    this.checkRate(userId ?? 'anon');

    const body: any = {
      input,
      sessionToken: dto?.sessionToken ?? undefined,
      includedRegionCodes: REGION_CODES,
      languageCode: 'es',
    };

    const lat = typeof dto?.lat === 'number' ? dto.lat : undefined;
    const lng = typeof dto?.lng === 'number' ? dto.lng : undefined;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      body.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: BIAS_RADIUS_METERS,
        },
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(AUTOCOMPLETE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.getApiKey(),
          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.error(`Autocomplete Google error ${res.status}: ${errText}`);
        return [];
      }

      const data: any = await res.json();
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      const preds: AutocompletePrediction[] = suggestions
        .map((s: any) => {
          const p = s?.placePrediction;
          if (!p?.placeId) return null;
          const full = p?.text?.text ?? '';
          const primary = p?.structuredFormat?.mainText?.text ?? full;
          const secondary = p?.structuredFormat?.secondaryText?.text ?? '';
          return {
            placeId: p.placeId,
            label: full || primary,
            primaryText: primary,
            secondaryText: secondary,
          };
        })
        .filter((x: AutocompletePrediction | null): x is AutocompletePrediction => !!x)
        .slice(0, 8);
      return preds;
    } catch (e: any) {
      this.logger.error(`Autocomplete fall: ${e?.message ?? e}`);
      return [];
    }
  }

  async details(userId: string, dto: PlaceDetailsDto): Promise<{ placeId: string; address: string; lat: number | null; lng: number | null }> {
    const placeId = dto?.placeId?.trim?.() ?? '';
    if (!placeId) {
      throw new HttpException('placeId requerido', HttpStatus.BAD_REQUEST);
    }
    this.checkRate(userId ?? 'anon');

    const token = dto?.sessionToken ? `?sessionToken=${encodeURIComponent(dto.sessionToken)}` : '';
    const url = `${DETAILS_BASE}/${encodeURIComponent(placeId)}${token}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.getApiKey(),
          'X-Goog-FieldMask': 'id,formattedAddress,location',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        this.logger.error(`Details Google error ${res.status}: ${errText}`);
        throw new HttpException('No se pudo obtener la dirección', HttpStatus.BAD_GATEWAY);
      }

      const data: any = await res.json();
      const lat = data?.location?.latitude;
      const lng = data?.location?.longitude;
      return {
        placeId: data?.id ?? placeId,
        address: typeof data?.formattedAddress === 'string' ? data.formattedAddress : '',
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      };
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      this.logger.error(`Details falló: ${e?.message ?? e}`);
      throw new HttpException('No se pudo obtener la dirección', HttpStatus.BAD_GATEWAY);
    }
  }
}
