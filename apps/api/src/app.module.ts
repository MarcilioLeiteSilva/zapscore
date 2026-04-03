import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { VersionModule } from './version/version.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    VersionModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
