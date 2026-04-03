import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ApiFootballService } from './api-football.service';

@Module({
  imports: [HttpModule],
  providers: [ApiFootballService],
  exports: [ApiFootballService],
})
export class ApiFootballModule {}
