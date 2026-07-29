import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ZapScoreSentinelService } from './zapscore-sentinel.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('sentinel')
export class ZapScoreSentinelController {
  constructor(private readonly sentinelService: ZapScoreSentinelService) {}

  /**
   * Endpoint público / monitorável para status de saúde do sistema
   */
  @Get('health-check')
  async healthCheck() {
    try {
      const tzAudit = await this.sentinelService.auditTimezoneConsistency();
      return {
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        timezoneAudit: tzAudit,
      };
    } catch (err: any) {
      return {
        status: 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }

  /**
   * Executa a rotina de auditoria completa imediatamente (Protegido por API Key)
   */
  @Post('audit')
  @UseGuards(ApiKeyGuard)
  async triggerAudit() {
    return await this.sentinelService.runAudit();
  }
}
