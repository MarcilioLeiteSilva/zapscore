import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Habilitar segurança básica com Helmet (ajustando CSP para compatibilidade com NestJS defaults se necessário)
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Pode ser ativado/ajustado conforme requisitos específicos do admin/painel
  }));

  // Habilitar validação global de payloads
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Habilitar CORS dinâmico
  const corsAllowedOrigins = configService.get<string>('CORS_ALLOWED_ORIGINS') || '*';
  const origin = corsAllowedOrigins === '*' ? '*' : corsAllowedOrigins.split(',').map(o => o.trim());

  app.enableCors({
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  
  logger.log(`ZapScore API is running on: ${await app.getUrl()}`);
}
bootstrap();
