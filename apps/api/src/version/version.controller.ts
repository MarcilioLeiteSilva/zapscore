import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('version')
export class VersionController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getVersion() {
    return {
      name: this.configService.get<string>('APP_NAME') || 'ZapScore API',
      version: this.configService.get<string>('APP_VERSION') || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV') || 'production',
    };
  }
}
