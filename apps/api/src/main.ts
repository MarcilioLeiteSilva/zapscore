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

  // Habilitar CORS dinâmico e suporte a todos os domínios (frontend, admin e mobile)
  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Reflete dinamicamente a origem da requisição para autorizar navegadores (CORS Preflight)
      callback(null, requestOrigin || '*');
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-api-key'],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  
  logger.log(`ZapScore API is running on: ${await app.getUrl()}`);
}
bootstrap();
