import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHello() {
    return {
      name: this.configService.get<string>('APP_NAME') || 'ZapScore API',
      status: 'ok',
      environment: this.configService.get<string>('NODE_ENV') || 'production',
    };
  }
}
