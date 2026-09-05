import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FixturesGateway } from '../fixtures/fixtures.gateway';
import { FixturesService } from '../fixtures/fixtures.service';
import { SofascoreProvider } from './providers/sofascore.provider';
import { FotmobProvider } from './providers/fotmob.provider';
import { GloboesporteProvider } from './providers/globoesporte.provider';
import { PocketbaseProvider, PocketbaseLineupResult } from './providers/pocketbase.provider';
import { EspnProvider } from './providers/espn.provider';
import { UolProvider } from './providers/uol.provider';
import { LivescoreProvider } from './providers/livescore.provider';
import { BesoccerProvider } from './providers/besoccer.provider';
import { TeamsService } from '../teams/teams.service';
import { NormalizedPlayer } from './interfaces/lineup-provider.interface';
import { SUPPORTED_COMPETITIONS } from '../config/competitions.config';

@Injectable()
export class LineupsService {
  private readonly logger = new Logger(LineupsService.name);

  // Telemetria de sucesso por provedor
  private readonly telemetry = {
    pocketbaseSuccessCount: 0,
    uolSuccessCount: 0,
    espnSuccessCount: 0,
    globoesporteSuccessCount: 0,
    livescoreSuccessCount: 0,
    besoccerSuccessCount: 0,
    sofascoreSuccessCount: 0,
    fotmobSuccessCount: 0,
    lastRunAt: null as Date | null,
    totalLineupsDispatched: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly fixturesGateway: FixturesGateway,
    private readonly fixturesService: FixturesService,
    private readonly teamsService: TeamsService,
    private readonly pocketbaseProvider: PocketbaseProvider,
    private readonly uolProvider: UolProvider,
    private readonly espnProvider: EspnProvider,
    private readonly globoesporteProvider: GloboesporteProvider,
    private readonly livescoreProvider: LivescoreProvider,
    private readonly besoccerProvider: BesoccerProvider,
    private readonly sofascoreProvider: SofascoreProvider,
    private readonly fotmobProvider: FotmobProvider,
  ) {}

  /**
   * Monitora e busca ativamente escalações para partidas das próximas 4 horas
   * com tripla redundância e ZERO chamadas à API-Football.
   */
  async syncUpcomingLineups(): Promise<{
    success: boolean;
    scannedMatches: number;
    syncedLineups: number;
    details: Array<{ fixtureId: number; match: string; source: string }>;
  }> {
    const now = new Date();
    this.telemetry.lastRunAt = now;

    const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4h atrás para cobrir partidas recentes/ao vivo
    const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Janela de 4 horas à frente

    const monitoredLeagueIds = SUPPORTED_COMPETITIONS.map((c) => c.externalId);

    try {
      // 1. Busca partidas na janela para as ligas do Sentinel
      const fixtures = await this.prisma.fixture.findMany({
        where: {
          date: { gte: windowStart, lte: windowEnd },
          league: { externalId: { in: monitoredLeagueIds } },
          statusShort: { in: ['NS', 'TBD', '1H', '2H', 'HT', 'LIVE'] },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          lineups: true,
        },
        orderBy: { date: 'asc' },
      });

      if (fixtures.length === 0) {
        return {
          success: true,
          scannedMatches: 0,
          syncedLineups: 0,
          details: [],
        };
      }

      // 2. Filtra partidas que ainda não possuem os 22 titulares com foto e grid completos
      const candidates = fixtures.filter((f) => {
        const homeStarters = f.lineups.filter(
          (l) =>
            l.teamId === f.homeTeam.externalId &&
            l.isStart &&
            l.grid &&
            l.playerPhoto &&
            !l.playerPhoto.includes('api.sofascore.app'),
        ).length;
        const awayStarters = f.lineups.filter(
          (l) =>
            l.teamId === f.awayTeam.externalId &&
            l.isStart &&
            l.grid &&
            l.playerPhoto &&
            !l.playerPhoto.includes('api.sofascore.app'),
        ).length;
        return homeStarters < 11 || awayStarters < 11;
      });

      if (candidates.length === 0) {
        return {
          success: true,
          scannedMatches: fixtures.length,
          syncedLineups: 0,
          details: [],
        };
      }

      this.logger.log(
        `[Lineup Agent] 🔎 Avaliando ${candidates.length} partidas sem escalação completa nas próximas 4 horas...`,
      );

      let syncedCount = 0;
      const details: Array<{ fixtureId: number; match: string; source: string }> = [];

      // 3. Executa a cascata de fontes para cada partida candidata
      for (const f of candidates) {
        const params = {
          homeTeamName: f.homeTeam.name,
          awayTeamName: f.awayTeam.name,
          matchDate: f.date,
          externalFixtureId: f.externalId,
          homeTeamExternalId: f.homeTeam.externalId,
          awayTeamExternalId: f.awayTeam.externalId,
          leagueExternalId: f.league?.externalId,
          fixtureId: f.id,
        };

        const matchLabel = `${f.homeTeam.name} x ${f.awayTeam.name}`;

        // 1ª Tentativa: PocketBase Buffer (Se já estiver validado como RESOLVED na collection)
        let result = (await this.pocketbaseProvider.getLineup(params)) as any;

        // 2ª Tentativa: UOL Placar (Foco Futebol Brasileiro, Séries A/B e Estaduais)
        if (!result || !result.confirmed) {
          result = await this.uolProvider.getLineup(params);
        }

        // 3ª Tentativa: ESPN (Grandes Ligas Europeias e Séries A/B sem WAF)
        if (!result || !result.confirmed) {
          result = await this.espnProvider.getLineup(params);
        }

        // 4ª Tentativa: 365Scores (Grade Global e Nacional Aberta)
        if (!result || !result.confirmed) {
          result = await this.globoesporteProvider.getLineup(params);
        }

        // 5ª Tentativa: LiveScore (Internacional Aberto / 255 Ligas sem Cloudflare)
        if (!result || !result.confirmed) {
          result = await this.livescoreProvider.getLineup(params);
        }

        // 6ª Tentativa: BeSoccer (Contingência Aberta)
        if (!result || !result.confirmed) {
          result = await this.besoccerProvider.getLineup(params);
        }

        // 7ª Tentativa: Sofascore (Fallback de contingência final)
        if (!result || !result.confirmed) {
          result = await this.sofascoreProvider.getLineup(params);
        }

        // Se uma das fontes entregou a escalação com os 22 titulares
        if (
          result &&
          result.confirmed &&
          result.homeTeam.starters.length >= 11 &&
          result.awayTeam.starters.length >= 11
        ) {
          // Enriquece fotos de jogadores com a base oficial de plantéis (TeamSquad) do clube
          await this.enrichPlayersWithSquadPhotos(f.homeTeam.externalId, result.homeTeam.starters);
          await this.enrichPlayersWithSquadPhotos(f.homeTeam.externalId, result.homeTeam.substitutes);
          await this.enrichPlayersWithSquadPhotos(f.awayTeam.externalId, result.awayTeam.starters);
          await this.enrichPlayersWithSquadPhotos(f.awayTeam.externalId, result.awayTeam.substitutes);

          // Centraliza a persistência no PocketBase como SSOT (Single Source of Truth)
          if (result.source !== 'pocketbase') {
            const pbRecordId = await this.pocketbaseProvider.saveLineupToPocketBase(f, result, result.source);
            if (pbRecordId) {
              result.recordId = pbRecordId;
            }
          }

          // Sincroniza a tabela relacional no PostgreSQL para consultas de alta performance da API/Apps
          await this.saveLineupToDatabase(f, result);
          syncedCount++;
          this.telemetry.totalLineupsDispatched++;

          if (result.source === 'pocketbase') {
            this.telemetry.pocketbaseSuccessCount++;
            if (result.recordId) {
              await this.pocketbaseProvider.markAsSynced(result.recordId);
            }
          } else if (result.source === 'uol') {
            this.telemetry.uolSuccessCount++;
          } else if (result.source === 'espn') {
            this.telemetry.espnSuccessCount++;
          } else if (result.source === 'globoesporte' || result.source === '365scores') {
            this.telemetry.globoesporteSuccessCount++;
          } else if (result.source === 'livescore') {
            this.telemetry.livescoreSuccessCount++;
          } else if (result.source === 'besoccer') {
            this.telemetry.besoccerSuccessCount++;
          } else if (result.source === 'sofascore') {
            this.telemetry.sofascoreSuccessCount++;
          } else if (result.source === 'fotmob') {
            this.telemetry.fotmobSuccessCount++;
          }

          details.push({
            fixtureId: f.externalId,
            match: matchLabel,
            source: result.source,
          });

          this.logger.log(
            `[Lineup Agent 🚀] Escalação confirmada salva via ${result.source.toUpperCase()} para ${matchLabel} (Liga: ${f.league.name})`,
          );
        }
      }

      return {
        success: true,
        scannedMatches: fixtures.length,
        syncedLineups: syncedCount,
        details,
      };
    } catch (err: any) {
      this.logger.error(`[Lineup Agent] Erro ao sincronizar escalações: ${err.message}`, err.stack);
      return {
        success: false,
        scannedMatches: 0,
        syncedLineups: 0,
        details: [],
      };
    }
  }

  /**
   * Gravação atômica dos 22 titulares e reservas no banco de dados e notificação via WebSocket
   */
  private async saveLineupToDatabase(fixture: any, result: any): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Remove escalações parciais anteriores
      await tx.fixtureLineup.deleteMany({
        where: { fixtureId: fixture.id },
      });

      // 2. Salva titulares e reservas do mandante
      for (const p of result.homeTeam.starters) {
        await tx.fixtureLineup.create({
          data: {
            fixtureId: fixture.id,
            teamId: fixture.homeTeam.externalId,
            player: p.player,
            number: p.number,
            pos: p.pos,
            grid: p.grid,
            isStart: true,
            playerPhoto: p.playerPhoto,
            externalPlayerId: p.externalPlayerId,
          },
        });
      }

      for (const p of result.homeTeam.substitutes) {
        await tx.fixtureLineup.create({
          data: {
            fixtureId: fixture.id,
            teamId: fixture.homeTeam.externalId,
            player: p.player,
            number: p.number,
            pos: p.pos,
            grid: p.grid,
            isStart: false,
            playerPhoto: p.playerPhoto,
            externalPlayerId: p.externalPlayerId,
          },
        });
      }

      // 3. Salva titulares e reservas do visitante
      for (const p of result.awayTeam.starters) {
        await tx.fixtureLineup.create({
          data: {
            fixtureId: fixture.id,
            teamId: fixture.awayTeam.externalId,
            player: p.player,
            number: p.number,
            pos: p.pos,
            grid: p.grid,
            isStart: true,
            playerPhoto: p.playerPhoto,
            externalPlayerId: p.externalPlayerId,
          },
        });
      }

      for (const p of result.awayTeam.substitutes) {
        await tx.fixtureLineup.create({
          data: {
            fixtureId: fixture.id,
            teamId: fixture.awayTeam.externalId,
            player: p.player,
            number: p.number,
            pos: p.pos,
            grid: p.grid,
            isStart: false,
            playerPhoto: p.playerPhoto,
            externalPlayerId: p.externalPlayerId,
          },
        });
      }
    });

    // 4. Emite atualização em tempo real via WebSocket
    try {
      const fullFixture = await this.prisma.fixture.findUnique({
        where: { id: fixture.id },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          lineups: true,
          events: true,
          stats: true,
        },
      });

      if (fullFixture) {
        this.fixturesGateway.emitFixtureUpdate(fullFixture.id, fullFixture);
        this.fixturesGateway.emitLeagueUpdate(fullFixture.league.externalId, fullFixture);
      }
    } catch (wsErr: any) {
      this.logger.warn(`[Lineup Agent] Falha ao emitir WebSocket: ${wsErr.message}`);
    }
  }

  /**
   * Retorna telemetria do Lineup Agent
   */
  getStatus() {
    return {
      status: 'ONLINE',
      agent: 'Lineup Agent (Multi-Source Tripla Redundância + PocketBase Buffer)',
      strategy: 'Zero API-Football / Janela de 4 Horas',
      sources: [
        'PocketBase Buffer (SSOT / Cache Local)',
        'UOL Placar (Foco Brasil / Estaduais / Copas)',
        'ESPN Core API (Principal Aberto / Europa & Séries A/B)',
        '365Scores (Grade Rápida 800+ Jogos)',
        'LiveScore (Mundial Aberto / 255 Ligas)',
        'BeSoccer (Contingência Aberta)',
        'Sofascore (Fallback Final)',
      ],
      telemetry: this.telemetry,
    };
  }

  /**
   * Sincroniza todas as partidas do dia para o PocketBase (active_fixtures)
   * Executado a cada 2 horas pelo cron worker
   */
  async syncTodayFixturesToPocketBase(): Promise<void> {
    try {
      const fixtures = (await this.fixturesService.findToday()) as any[];
      if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) return;
      await this.pocketbaseProvider.syncActiveFixtures(fixtures);
      this.logger.log(`[LineupsService] 🔄 Sincronizadas ${fixtures.length} partidas de hoje com o PocketBase`);
    } catch (e: any) {
      this.logger.error(`[LineupsService] Erro ao sincronizar partidas no PocketBase: ${e.message}`);
    }
  }

  /**
   * Enriquece fotos de jogadores cruzando com a tabela TeamSquad (plantel oficial do clube já existente no banco)
   */
  private async enrichPlayersWithSquadPhotos(
    teamExternalId: number,
    players: NormalizedPlayer[],
  ): Promise<void> {
    if (!teamExternalId || !Array.isArray(players) || players.length === 0) return;

    try {
      const squadList: Array<{ name: string; number?: number | null; photo?: string; id?: number }> =
        await this.teamsService.getSquad(teamExternalId);

      if (!Array.isArray(squadList) || squadList.length === 0) return;

      const normalize = (n: string) =>
        (n || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .trim();

      for (const p of players) {
        if (p.playerPhoto) continue; // Já possui foto preenchida

        const pNorm = normalize(p.player);

        // 1. Tenta correspondência por número da camisa
        let matched = p.number ? squadList.find((s) => s.number === p.number && s.photo) : undefined;

        // 2. Se não casou por camisa ou não tem número, tenta por nome aproximado
        if (!matched) {
          matched = squadList.find((s) => {
            if (!s.name || !s.photo) return false;
            const sNorm = normalize(s.name);
            return (
              sNorm === pNorm ||
              (pNorm.length >= 4 && sNorm.includes(pNorm)) ||
              (sNorm.length >= 4 && pNorm.includes(sNorm))
            );
          });
        }

        if (matched && matched.photo) {
          p.playerPhoto = matched.photo;
        }
      }
    } catch (e: any) {
      this.logger.warn(`[Lineup Agent] Falha ao enriquecer fotos do time ${teamExternalId}: ${e.message}`);
    }
  }
}
