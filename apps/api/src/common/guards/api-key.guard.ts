import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const expectedApiKey = this.configService.get<string>('ADMIN_API_KEY');

    if (!expectedApiKey) {
      console.warn('ADMIN_API_KEY is not defined in environment variables. API access to protected routes is blocked.');
      throw new UnauthorizedException('API key is not configured on the server');
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
