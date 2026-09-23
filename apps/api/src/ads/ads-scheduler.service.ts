import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdsService } from './ads.service';

@Injectable()
export class AdsSchedulerService {
  private readonly logger = new Logger(AdsSchedulerService.name);

  constructor(private readonly adsService: AdsService) {}

  /**
   * Executa a cada 15 minutos para fazer a rotação e manutenção de ciclo de vida das campanhas
   */
  @Cron('*/15 * * * *')
  async handleAdsLifecycleCron() {
    try {
      const campaigns = await this.adsService.listCampaigns();
      if (!campaigns || campaigns.length === 0) return;

      const now = new Date();
      let promotedCount = 0;
      let expiredCount = 0;
      let pausedCapCount = 0;

      for (const c of campaigns) {
        // 1. Ativação de campanhas agendadas
        if (c.status === 'scheduled' && c.start_at) {
          const start = new Date(c.start_at);
          if (now >= start && (!c.end_at || now <= new Date(c.end_at))) {
            await this.adsService.updateStatus(c.id, 'active');
            promotedCount++;
            this.logger.log(`[AdsScheduler] 🟢 Campanha "${c.title}" ativada automaticamente por agendamento.`);
          }
        }

        // 2. Expiração de campanhas por término de data
        if (c.status === 'active' && c.end_at) {
          const end = new Date(c.end_at);
          if (now > end) {
            await this.adsService.updateStatus(c.id, 'expired');
            expiredCount++;
            this.logger.log(`[AdsScheduler] ⌛ Campanha "${c.title}" expirada por prazo final.`);
          }
        }

        // 3. Pausa de campanhas que atingiram o teto de impressões contratado (Capping)
        if (c.status === 'active' && c.max_impressions > 0 && c.impressions_count >= c.max_impressions) {
          await this.adsService.updateStatus(c.id, 'paused');
          pausedCapCount++;
          this.logger.log(`[AdsScheduler] 🛑 Campanha "${c.title}" pausada por atingir o limite contratual (${c.impressions_count}/${c.max_impressions} impressões).`);
        }
      }

      if (promotedCount > 0 || expiredCount > 0 || pausedCapCount > 0) {
        this.logger.log(
          `[AdsScheduler] Ciclo concluído: ${promotedCount} ativadas, ${expiredCount} expiradas, ${pausedCapCount} pausadas por capping.`,
        );
      }
    } catch (err: any) {
      this.logger.error(`[AdsScheduler] Erro no ciclo de vida de anúncios: ${err.message}`);
    }
  }
}
