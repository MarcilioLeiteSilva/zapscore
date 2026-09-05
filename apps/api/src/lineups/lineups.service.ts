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
            !l.playerPhoto.includes('api.sofascore.app') &&
            !l.playerPhoto.includes('imagecache.365scores.com'),
        ).length;
        const awayStarters = f.lineups.filter(
          (l) =>
            l.teamId === f.awayTeam.externalId &&
            l.isStart &&
            l.grid &&
            l.playerPhoto &&
            !l.playerPhoto.includes('api.sofascore.app') &&
            !l.playerPhoto.includes('imagecache.365scores.com'),
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

        // Se o buffer não possuir a escalação completa, executa busca paralela/concorrente
        // entre os provedores abertos (UOL, ESPN, 365Scores, LiveScore, BeSoccer)
        if (
          !result ||
          !result.confirmed ||
          result.homeTeam?.starters?.length < 11 ||
          result.awayTeam?.starters?.length < 11
        ) {
          const openProviderTasks = [
            this.uolProvider.getLineup(params).catch(() => null),
            this.espnProvider.getLineup(params).catch(() => null),
            this.globoesporteProvider.getLineup(params).catch(() => null),
            this.livescoreProvider.getLineup(params).catch(() => null),
            this.besoccerProvider.getLineup(params).catch(() => null),
          ];

          const openResults = await Promise.all(openProviderTasks);

          result = openResults.find(
            (r) =>
              r &&
              r.confirmed &&
              r.homeTeam?.starters?.length >= 11 &&
              r.awayTeam?.starters?.length >= 11,
          );
        }

        // Fallback de contingência final caso os provedores abertos ainda não tenham os dados
        if (!result || !result.confirmed) {
          result = await this.sofascoreProvider.getLineup(params).catch(() => null);
        }

        // Se uma das fontes entregou a escalação com os 22 titulares
        if (
          result &&
          result.confirmed &&
          result.homeTeam.starters.length >= 11 &&
          result.awayTeam.starters.length >= 11
        ) {
          // 1. Aplica cálculo de grid tático universal dinâmico e independente para cada clube
          this.applyUniversalTacticalGrid(result.homeTeam.starters, result.formation?.home);
          this.applyUniversalTacticalGrid(result.awayTeam.starters, result.formation?.away);

          // 2. Enriquece fotos de jogadores com a base oficial de plantéis (TeamSquad) do clube
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
      sourcesHealth: [
        {
          id: 'pocketbase',
          name: 'PocketBase Buffer',
          badge: 'BUFFER SSOT',
          status: 'ONLINE',
          statusLabel: 'Online',
          description: 'Ingestão e cache local em tempo real (match_lineups)',
          color: 'purple',
          successCount: this.telemetry.pocketbaseSuccessCount,
        },
        {
          id: 'uol',
          name: 'UOL Placar',
          badge: 'NACIONAL',
          status: 'ONLINE',
          statusLabel: 'Online',
          description: 'Foco Brasil (Séries A/B, Estaduais e Copas)',
          color: 'amber',
          successCount: this.telemetry.uolSuccessCount,
        },
        {
          id: 'espn',
          name: 'ESPN Core API',
          badge: 'INTERNACIONAL',
          status: 'ONLINE',
          statusLabel: 'Online',
          description: 'API pública sem WAF com fotos e escalações oficiais',
          color: 'cyan',
          successCount: this.telemetry.espnSuccessCount,
        },
        {
          id: 'globoesporte',
          name: '365Scores',
          badge: 'MULTI-LIGA ABERTO',
          status: 'ONLINE',
          statusLabel: 'Online',
          description: '800+ jogos/dia, titulares com grid tático e escalações confirmadas',
          color: 'emerald',
          successCount: this.telemetry.globoesporteSuccessCount,
        },
        {
          id: 'livescore',
          name: 'LiveScore API',
          badge: 'MUNDIAL ABERTO',
          status: 'ONLINE',
          statusLabel: 'Online',
          description: '255 competições mundiais abertas, posições e reservas',
          color: 'blue',
          successCount: this.telemetry.livescoreSuccessCount,
        },
        {
          id: 'besoccer',
          name: 'BeSoccer Global',
          badge: 'CONTINGÊNCIA',
          status: 'ONLINE',
          statusLabel: 'Online',
          description: 'API pública global para contingência',
          color: 'indigo',
          successCount: this.telemetry.besoccerSuccessCount,
        },
        {
          id: 'sofascore',
          name: 'Sofascore API',
          badge: 'WAF CLOUDFLARE',
          status: 'BLOCKED',
          statusLabel: 'Bloqueado (403)',
          description: 'Bloqueado por desafio Cloudflare WAF (403 Forbidden)',
          color: 'red',
          successCount: this.telemetry.sofascoreSuccessCount,
        },
        {
          id: 'fotmob',
          name: 'FotMob API',
          badge: 'INOPERANTE 404',
          status: 'DEPRECATED',
          statusLabel: 'Inoperante (404)',
          description: 'Endpoints legados descontinuados pelo provedor',
          color: 'rose',
          successCount: this.telemetry.fotmobSuccessCount,
        },
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
   * Calcula e normaliza as coordenadas de campo tático (grid: "row:col")
   * dinamicamente para os 11 titulares a partir da formação de cada time (ex: "4-2-3-1", "3-5-2", "4-3-3").
   * Identifica o goleiro de forma inteligente (1:1) e distribui defensores, meias e atacantes
   * nas linhas e colunas táticas correspondentes, mesmo que a formação mude.
   */
  private applyUniversalTacticalGrid(starters: NormalizedPlayer[], formation?: string): void {
    if (!Array.isArray(starters) || starters.length < 11) return;

    // 1. Identifica o goleiro (pela posição 'G', 'Goleiro', 'Goalkeeper' ou camisa 1)
    let gkIndex = starters.findIndex((p) => {
      const pos = (p.pos || '').toUpperCase();
      return pos === 'G' || pos.includes('GOL') || pos.includes('KEEP');
    });

    if (gkIndex === -1) {
      gkIndex = starters.findIndex((p) => p.number === 1);
    }
    if (gkIndex === -1) {
      gkIndex = 0; // Fallback seguro
    }

    const gk = starters[gkIndex];
    gk.grid = '1:1';
    gk.pos = gk.pos || 'G';

    // 2. Separa os outros 10 jogadores de linha
    const outfield = starters.filter((_, idx) => idx !== gkIndex);

    // 3. Decompõe a formação tática (ex: "4-2-3-1" => [4, 2, 3, 1])
    let lines = (formation || '')
      .split('-')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);

    const sumLines = lines.reduce((a, b) => a + b, 0);
    if (sumLines !== 10) {
      const digits = (formation || '').replace(/[^0-9]/g, '').split('').map(Number);
      if (digits.reduce((a, b) => a + b, 0) === 10) {
        lines = digits;
      } else {
        lines = [4, 3, 3]; // Padrão clássico equilibrado
      }
    }

    // 4. Ordena os jogadores de linha por hierarquia posicional (Defesa -> Meio -> Ataque)
    // para garantir que zagueiros/laterais fiquem na linha 2, volantes/meias na linha 3/4 e atacantes na linha final
    const posPriority = (p: NormalizedPlayer): number => {
      const pos = (p.pos || '').toUpperCase();
      if (pos === 'D' || pos.includes('DEF') || pos.includes('ZAG') || pos.includes('LAT') || pos.includes('BACK')) return 1;
      if (pos === 'M' || pos.includes('MEI') || pos.includes('VOL') || pos.includes('MID')) return 2;
      if (pos === 'F' || pos.includes('ATA') || pos.includes('PON') || pos.includes('CEN') || pos.includes('STRIK') || pos.includes('FORW')) return 3;
      return 2; // neutro
    };

    outfield.sort((a, b) => posPriority(a) - posPriority(b));

    // 5. Atribui row:col linha a linha conforme a formação tática
    let playerIdx = 0;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const row = lineIdx + 2; // Linha 1 é reservada ao goleiro
      const playersInLine = lines[lineIdx];

      for (let col = 1; col <= playersInLine; col++) {
        if (playerIdx < outfield.length) {
          outfield[playerIdx].grid = `${row}:${col}`;
          playerIdx++;
        }
      }
    }

    // Qualquer excedente
    while (playerIdx < outfield.length) {
      outfield[playerIdx].grid = `${lines.length + 1}:1`;
      playerIdx++;
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
      let squadList: Array<{ name: string; number?: number | null; photo?: string; id?: number }> = [];

      // 1. Tenta leitura direta na tabela TeamSquad (cache local em milissegundos)
      try {
        const teamSquad = await (this.prisma as any).teamSquad.findUnique({
          where: { teamExternalId },
        });
        if (teamSquad && teamSquad.squadJson) {
          squadList = JSON.parse(teamSquad.squadJson);
        }
      } catch (_) {}

      // 2. Se não encontrou no banco, consulta via TeamsService
      if (!Array.isArray(squadList) || squadList.length === 0) {
        squadList = (await this.teamsService.getSquad(teamExternalId)) || [];
      }

      if (!Array.isArray(squadList) || squadList.length === 0) return;

      const normalize = (n: string) =>
        (n || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .trim();

      for (const p of players) {
        // Se já possui foto oficial e válida do CDN oficial, preserva
        if (
          p.playerPhoto &&
          (p.playerPhoto.includes('media.api-sports.io') || p.playerPhoto.includes('img.sofascore.com'))
        ) {
          continue;
        }

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
