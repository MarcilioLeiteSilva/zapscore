import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { SentinelAlertService } from './sentinel-alert.service';

@Injectable()
export class ZapScoreSentinelService {
  private readonly logger = new Logger(ZapScoreSentinelService.name);

  constructor(
    private readonly apiFootball: ApiFootballService,
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
    private readonly alertService: SentinelAlertService,
  ) {}

  /**
   * Monitoramento contínuo — roda a cada 5 minutos.
   * Realiza validação cruzada entre a API-Football e o banco de dados da ZapScore.
   */
  @Cron('*/5 * * * *')
  async runAudit() {
    this.logger.log('[Sentinel] Iniciando auditoria de consistência...');
    try {
      const results = await this.auditLiveMatches();
      const timezoneResults = await this.auditTimezoneConsistency();
      this.logger.log(`[Sentinel] Auditoria concluída. Partidas auditadas com sucesso. Live Anomalias: ${results.anomaliesCount}`);
      return { live: results, timezone: timezoneResults };
    } catch (err: any) {
      this.logger.error(`[Sentinel] Erro durante auditoria: ${err.message}`, err.stack);
      await this.alertService.sendAlert({
        title: 'Erro de Execução da Auditoria Sentinela',
        severity: 'WARNING',
        description: `Falha ao executar rotina do Sentinela: ${err.message}`,
      });
      return { error: err.message };
    }
  }

  /**
   * Auditoria de partidas ao vivo e verificação de desincronizações
   */
  async auditLiveMatches() {
    let anomaliesCount = 0;
    let autoHealedCount = 0;

    // 1. Busca todos os jogos ao vivo no mundo na API-Football
    let liveFixtures: any[] = [];
    try {
      liveFixtures = (await this.apiFootball.getFixtures({ live: 'all' })) || [];
    } catch (err: any) {
      await this.alertService.sendAlert({
        title: 'Falha na Conexão com API-Football',
        severity: 'CRITICAL',
        description: `Não foi possível conectar à API-Football para auditar partidas ao vivo: ${err.message}`,
      });
      return { anomaliesCount: 0, autoHealedCount: 0, status: 'API_ERROR' };
    }

    // 2. Busca ligas monitoradas no sistema
    const dbLeagues = await this.prisma.league.findMany({ select: { externalId: true, name: true } });
    const monitoredLeagueIds = new Set(dbLeagues.map(l => l.externalId));

    const monitoredLive = liveFixtures.filter((f: any) => monitoredLeagueIds.has(f.league?.id));

    for (const apiFixture of monitoredLive) {
      const externalId = apiFixture.fixture.id;
      const homeName = apiFixture.teams.home.name;
      const awayName = apiFixture.teams.away.name;
      const fixtureLabel = `${homeName} x ${awayName} (ID: ${externalId})`;
      const apiStatus = apiFixture.fixture.status.short;

      // Busca a partida no banco de dados local da Zapscore
      const dbFixture = await this.prisma.fixture.findUnique({
        where: { externalId },
      });

      if (!dbFixture) {
        anomaliesCount++;
        await this.alertService.sendAlert({
          title: 'Partida Ao Vivo Ausente no Banco de Dados',
          severity: 'WARNING',
          fixtureInfo: fixtureLabel,
          description: `A partida está ao vivo na API-Football (Status: ${apiStatus}), mas não foi cadastrada no banco de dados local.`,
        });
        continue;
      }

      // 3. Verificação de Desincronização de Status (Partida Ao Vivo no Externo, mas `NS` no Banco Local)
      if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(apiStatus) && dbFixture.statusShort === 'NS') {
        anomaliesCount++;
        this.logger.warn(`[Sentinel] Desincronização detectada em ${fixtureLabel}: API=${apiStatus}, DB=${dbFixture.statusShort}`);

        // Tenta autocorreção ativando a sincronização ao vivo
        let autoHealed = false;
        try {
          await this.syncService.syncLive(dbFixture.leagueId ? (await this.prisma.league.findUnique({ where: { id: dbFixture.leagueId } }))?.externalId : undefined);
          autoHealed = true;
          autoHealedCount++;
        } catch (syncErr: any) {
          this.logger.error(`[Sentinel] Falha na autocorreção de ${fixtureLabel}: ${syncErr.message}`);
        }

        await this.alertService.sendAlert({
          title: 'Desincronização de Status Detectada (Partida Congelada em NS)',
          severity: 'CRITICAL',
          fixtureInfo: fixtureLabel,
          description: `A partida está ocorrendo ao vivo (${apiStatus}), porém constava como Não Iniciada (NS) no ZapScore.`,
          autoHealed,
        });
      }

      // 4. Verificação de Divergência de Placar
      const apiHomeGoals = apiFixture.goals.home ?? 0;
      const apiAwayGoals = apiFixture.goals.away ?? 0;
      if (dbFixture.homeGoals !== null && dbFixture.awayGoals !== null) {
        if (dbFixture.homeGoals !== apiHomeGoals || dbFixture.awayGoals !== apiAwayGoals) {
          anomaliesCount++;
          this.logger.warn(`[Sentinel] Divergência de placar em ${fixtureLabel}: DB=${dbFixture.homeGoals}x${dbFixture.awayGoals}, API=${apiHomeGoals}x${apiAwayGoals}`);

          let autoHealed = false;
          try {
            await this.syncService.syncLive();
            autoHealed = true;
            autoHealedCount++;
          } catch (syncErr: any) {
            this.logger.error(`[Sentinel] Falha na autocorreção de placar: ${syncErr.message}`);
          }

          await this.alertService.sendAlert({
            title: 'Divergência de Placar Detectada',
            severity: 'WARNING',
            fixtureInfo: fixtureLabel,
            description: `Placar no ZapScore (${dbFixture.homeGoals}x${dbFixture.awayGoals}) difere da API-Football (${apiHomeGoals}x${apiAwayGoals}).`,
            autoHealed,
          });
        }
      }
    }

    return { anomaliesCount, autoHealedCount, auditedLiveCount: monitoredLive.length, status: 'OK' };
  }

  /**
   * Auditoria de datas e fuso horário de Brasília
   */
  async auditTimezoneConsistency() {
    const todayBrt = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const startBrt = new Date(`${todayBrt}T03:00:00.000Z`);
    const endBrt = new Date(`${todayBrt}T02:59:59.999Z`);
    endBrt.setDate(endBrt.getDate() + 1);

    const countToday = await this.prisma.fixture.count({
      where: {
        date: { gte: startBrt, lte: endBrt },
      },
    });

    return { todayDate: todayBrt, totalFixturesToday: countToday };
  }
}
