import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

    if (!token || token !== secret) {
      throw new UnauthorizedException('Secreto de cron inválido');
    }
    return true;
  }
}
