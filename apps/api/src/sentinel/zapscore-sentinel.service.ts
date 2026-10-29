import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApiFootballService } from '../integrations/api-football/api-football.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { SentinelAlertService } from './sentinel-alert.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SUPPORTED_COMPETITIONS } from '../config/competitions.config';

@Injectable()
export class ZapScoreSentinelService {
  private readonly logger = new Logger(ZapScoreSentinelService.name);

  constructor(
    private readonly apiFootball: ApiFootballService,
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
    private readonly alertService: SentinelAlertService,
    private readonly notificationsService: NotificationsService,
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
      const anomaliesResults = await this.auditScheduleAndStatusAnomalies();
      const timezoneResults = await this.auditTimezoneConsistency();
      const roundsResults = await this.checkFinishedRounds();
      this.logger.log(`[Sentinel] Auditoria concluída. Live Anomalias: ${results.anomaliesCount}, Agenda/Status Anomalias: ${anomaliesResults.anomaliesCount} (Auto-healed: ${anomaliesResults.autoHealedCount}), Rodadas Concluídas: ${roundsResults.completedRoundsCount}`);
      return { live: results, anomalies: anomaliesResults, timezone: timezoneResults, rounds: roundsResults };
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
   * Varredura completa de partidas locais para detectar anomalias de agenda e status:
   * 1. Partidas marcadas como 'NS' cujo horário agendado já passou (+15 min).
   * 2. Partidas congeladas em status 'LIVE' há tempo excessivo (+140 min).
   *
   * ECONOMIA DE REQUISIÇÕES:
   * Apenas os IDs suspeitos detectados no banco local são consultados na API externa,
   * em lote único agrupado (ids: id1-id2-id3) consumindo no máximo 1 requisição.
   */
  async auditScheduleAndStatusAnomalies() {
    const now = new Date();
    // Limite de tolerância para jogo não iniciado: 15 minutos após o horário agendado
    const nsThreshold = new Date(now.getTime() - 15 * 60 * 1000);
    // Janela temporal recente (últimas 48 horas)
    const lowerBound = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    // Limite de tolerância para jogo ao vivo congelado: 140 minutos após o início
    const liveFrozenThreshold = new Date(now.getTime() - 140 * 60 * 1000);

    const monitoredLeagueIds = SUPPORTED_COMPETITIONS.map((c) => c.externalId);

    // 1. Varredura no banco local (Custo ZERO de API)
    const suspectFixtures = await this.prisma.fixture.findMany({
      where: {
        league: { externalId: { in: monitoredLeagueIds } },
        OR: [
          {
            statusShort: 'NS',
            date: { gte: lowerBound, lte: nsThreshold },
          },
          {
            statusShort: { in: ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'] },
            date: { gte: lowerBound, lte: liveFrozenThreshold },
          },
        ],
      },
      include: {
        league: { select: { externalId: true, name: true } },
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    if (suspectFixtures.length === 0) {
      return { anomaliesCount: 0, autoHealedCount: 0, status: 'OK' };
    }

    this.logger.warn(`[Sentinel] Detectadas ${suspectFixtures.length} partidas com suspeita de discrepância/atraso no banco local.`);

    let autoHealedCount = 0;
    const externalIds = suspectFixtures.map((f) => f.externalId);

    // 2. Consulta cirúrgica à API em lotes de até 20 IDs (1 única requisição HTTP para até 20 jogos)
    const chunkSize = 20;
    for (let i = 0; i < externalIds.length; i += chunkSize) {
      const chunk = externalIds.slice(i, i + chunkSize);
      let apiFixtures: any[] = [];
      try {
        apiFixtures = (await this.apiFootball.getFixtures({ ids: chunk.join('-') })) || [];
      } catch (err: any) {
        this.logger.error(`[Sentinel] Falha ao consultar lote de fixtures anômalas na API: ${err.message}`);
        continue;
      }

      for (const apiFixture of apiFixtures) {
        const extId = apiFixture.fixture?.id;
        const dbFixture = suspectFixtures.find((f) => f.externalId === extId);
        if (!dbFixture) continue;

        const homeName = dbFixture.homeTeam?.name || 'Time A';
        const awayName = dbFixture.awayTeam?.name || 'Time B';
        const fixtureLabel = `${homeName} x ${awayName} (ID: ${extId})`;

        const apiDate = new Date(apiFixture.fixture.date);
        const dbDate = new Date(dbFixture.date);
        const apiStatus = apiFixture.fixture.status?.short || 'NS';
        const apiStatusLong = apiFixture.fixture.status?.long || 'Not Started';
        const apiElapsed = apiFixture.fixture.status?.elapsed ?? null;
        const apiHomeGoals = apiFixture.goals?.home ?? null;
        const apiAwayGoals = apiFixture.goals?.away ?? null;

        const dateDiffMinutes = Math.abs((apiDate.getTime() - dbDate.getTime()) / (1000 * 60));
        const isDateChanged = dateDiffMinutes > 1; // Diferença superior a 1 minuto
        const isStatusChanged = apiStatus !== dbFixture.statusShort;

        if (isDateChanged || isStatusChanged) {
          try {
            const updateData: any = {};

            if (isDateChanged) {
              updateData.date = apiDate;
              if (apiFixture.fixture.venue?.name) updateData.venueName = apiFixture.fixture.venue.name;
              if (apiFixture.fixture.venue?.city) updateData.venueCity = apiFixture.fixture.venue.city;
            }

            if (isStatusChanged) {
              updateData.statusShort = apiStatus;
              updateData.statusLong = apiStatusLong;
              updateData.elapsed = apiElapsed;
              if (['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'LIVE'].includes(apiStatus)) {
                updateData.homeGoals = apiHomeGoals ?? 0;
                updateData.awayGoals = apiAwayGoals ?? 0;
              }
            }

            await this.prisma.fixture.update({
              where: { id: dbFixture.id },
              data: updateData,
            });

            if (['FT', 'AET', 'PEN'].includes(apiStatus)) {
              await this.syncService.syncFixtureDetail(extId).catch((e: any) =>
                this.logger.warn(`[Sentinel] Não foi possível sincronizar detalhes de ${fixtureLabel}: ${e.message}`)
              );
            }

            autoHealedCount++;
            this.logger.log(`[Sentinel] 🛠️ Autocorreção aplicada em ${fixtureLabel}: ${isDateChanged ? `Data ajustada de ${dbDate.toISOString()} para ${apiDate.toISOString()}. ` : ''}${isStatusChanged ? `Status ajustado de ${dbFixture.statusShort} para ${apiStatus}.` : ''}`);

            await this.alertService.sendAlert({
              title: isDateChanged ? 'Discrepância de Data Corrigida (Partida Remarcada)' : 'Status de Partida Corrigido pelo Sentinel',
              severity: 'INFO',
              fixtureInfo: fixtureLabel,
              description: `Partida ajustada automaticamente: ${isDateChanged ? `Nova data: ${apiDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. ` : ''}Novo Status: ${apiStatus}.`,
              autoHealed: true,
            });
          } catch (updateErr: any) {
            this.logger.error(`[Sentinel] Erro ao aplicar autocorreção em ${fixtureLabel}: ${updateErr.message}`);
          }
        }
      }
    }

    return { anomaliesCount: suspectFixtures.length, autoHealedCount, status: 'OK' };
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

  /**
   * Monitora partidas do dia e detecta quando 100% dos jogos de uma liga atingem FT.
   * Enfileira o resumo de placares no Agente Push para aprovação ou auto-disparo em 60 min.
   */
  async checkFinishedRounds() {
    const todayBrt = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const startBrt = new Date(`${todayBrt}T03:00:00.000Z`);
    const endBrt = new Date(`${todayBrt}T02:59:59.999Z`);
    endBrt.setDate(endBrt.getDate() + 1);

    let completedRoundsCount = 0;
    const CUP_LEAGUE_IDS = [13, 73, 612, 1, 10];
    const monitoredLeagues = SUPPORTED_COMPETITIONS.filter((comp) => !CUP_LEAGUE_IDS.includes(comp.externalId));

    for (const comp of monitoredLeagues) {
      try {
        const todayFixtures = await this.prisma.fixture.findMany({
          where: {
            league: { externalId: comp.externalId },
            date: { gte: startBrt, lte: endBrt },
          },
          select: {
            id: true,
            statusShort: true,
            round: true,
            season: true,
          },
        });

        if (todayFixtures.length === 0) continue;

        // Verifica se TODOS os jogos agendados para hoje estão com status finalizado
        const allFinished = todayFixtures.every((f) => ['FT', 'AET', 'PEN'].includes(f.statusShort || ''));

        if (allFinished) {
          const targetSeason = todayFixtures[0]?.season || comp.activeSeasons?.[0] || 2026;
          const result = await this.notificationsService.enqueueRoundSummary(comp.externalId, targetSeason);
          if (result.success && result.queueItem) {
            completedRoundsCount++;
            this.logger.log(`[Sentinel] 🏁 Todas as ${todayFixtures.length} partidas de hoje da liga ${comp.name} foram concluídas (FT). Resumo pronto no Agente Push.`);
          }
        }
      } catch (err: any) {
        this.logger.error(`[Sentinel] Erro ao auditar encerramento de rodada para ${comp.name}: ${err.message}`);
      }
    }

    return { completedRoundsCount };
  }
}

