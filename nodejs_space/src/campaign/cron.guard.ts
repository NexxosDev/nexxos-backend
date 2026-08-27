import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Protege endpoints que son invocados por un cron externo.
 * Espera el header `Authorization: Bearer <CRON_SECRET>`.
 */
@Injectable()
export class CronGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const secret = this.config.get<string>('CRON_SECRET');

    if (!secret) {
      throw new UnauthorizedException('CRON_SECRET no configurado en el servidor');
    }

    const header: string = req.headers?.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token || !this.safeEqual(token, secret)) {
      throw new UnauthorizedException('Secreto de cron inválido');
    }
    return true;
  }

  /** Comparación en tiempo constante para evitar ataques de temporización. */
  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
