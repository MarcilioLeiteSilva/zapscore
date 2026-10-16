import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SUPPORTED_COMPETITIONS } from '../config/competitions.config';

export interface BroadcastPushDto {
  leagueId?: number;
  appSlug?: string;
  title: string;
  body: string;
  imageUrl?: string;
  dataPayload?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly PB_BRASIL = 'https://zapscore-pocketbase-brasil.gtalg3.easypanel.host';
  private readonly PB_ESTADUAIS = 'https://zapscore-pocketbase-estaduais.gtalg3.easypanel.host';
  private readonly PB_EUROPA = 'https://zapscore-pocketbase-europa.gtalg3.easypanel.host';
  private readonly PB_COPAS = 'https://zapscore-pocketbase-copas.gtalg3.easypanel.host';

  // Armazenamento em memória para PushQueue sem dependência de schema no PostgreSQL
  private inMemoryPushQueue: Array<{
    id: string;
    leagueId: number;
    appSlug: string;
    round: string;
    title: string;
    body: string;
    imageUrl?: string | null;
    status: string;
    detectedAt: Date;
    scheduledAutoDispatchAt: Date;
    dispatchedAt?: Date | null;
    sentCount?: number;
    target?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  private hasPushQueueTable = true;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Identifica o módulo correspondente da liga para categorização visual
   */
  private getModuleForLeague(leagueId: number): { id: string; name: string; icon: string } {
    const id = Number(leagueId);
    if ([71, 72].includes(id)) return { id: 'brasil', name: 'Brasil', icon: '🇧🇷' };
    if ([39, 140, 135, 78, 61, 2].includes(id)) return { id: 'europa', name: 'Europa', icon: '🇪🇺' };
    if ([73, 612, 13, 1, 10].includes(id)) return { id: 'copas', name: 'Copas', icon: '🏆' };
    return { id: 'estaduais', name: 'Estaduais', icon: '📍' };
  }

  /**
   * Mapeia a liga / appSlug para o endpoint correto do PocketBase
   * Retorna null se a competição não pertencer a nenhum app com PocketBase ativo (Zero vazamento de escopo)
   */
  private resolvePocketBaseTarget(leagueId?: number, appSlug?: string): { url: string; slug: string; name: string } | null {
    const slug = (appSlug || '').toLowerCase().trim();
    const id = leagueId ? Number(leagueId) : 0;

    // 1. Competições sem aplicativo dedicado (Amistosos, Copa do Mundo, etc.)
    if ([1, 10].includes(id)) {
      return null;
    }

    // 2. Copas (Copa do Nordeste, Copa do Brasil, Copa Libertadores)
    const copasSlugs: Record<string, number> = {
      copadonordeste: 612,
      copadobrasil: 73,
      copalibertadores: 13,
    };
    if (copasSlugs[slug] || [612, 73, 13].includes(id)) {
      let resolvedSlug = slug;
      if (!resolvedSlug) {
        resolvedSlug = Object.keys(copasSlugs).find((k) => copasSlugs[k] === id) || '';
      }
      if (resolvedSlug) {
        return { url: this.PB_COPAS, slug: resolvedSlug, name: 'PocketBase Copas' };
      }
    }

    // 1. Brasil / Brasileirão
    if (id === 71 || id === 72 || slug === 'brasileirao') {
      return { url: this.PB_BRASIL, slug: 'brasileirao', name: 'PocketBase Brasil' };
    }

    // 2. Europa
    const europaSlugs: Record<string, number> = {
      laliga: 140,
      bundesliga: 78,
      premierleague: 39,
      'seriea-italia': 135,
      'ligue1-franca': 61,
      champions_league: 2,
    };
    if (europaSlugs[slug] || [140, 78, 39, 135, 61, 2].includes(id)) {
      let resolvedSlug = slug;
      if (!resolvedSlug) {
        resolvedSlug = Object.keys(europaSlugs).find((k) => europaSlugs[k] === id) || '';
      }
      if (resolvedSlug) {
        return { url: this.PB_EUROPA, slug: resolvedSlug, name: 'PocketBase Europa' };
      }
    }

    // 3. Estaduais (Apenas ligas estaduais mapeadas)
    const estadualSlugs: Record<string, number[]> = {
      campeonato_paulista: [475, 476],
      campeonato_carioca: [624, 851],
      campeonato_mineiro: [629, 619],
      campeonato_gaucho: [477, 478, 853],
      campeonato_baiano: [602, 613],
      campeonato_paranaense: [606, 614],
      campeonato_cearense: [609, 620],
      campeonato_pernambucano: [622],
      campeonato_paraibano: [603],
      campeonato_maranhense: [608],
      campeonato_catarinense: [604],
      campeonato_capixaba: [611],
      campeonato_goiano: [628],
      campeonato_matogrossense: [630],
      campeonato_sul_matogrossense: [623],
      campeonato_brasiliense: [610],
      campeonato_alagoano: [77],
      campeonato_potiguar: [616],
      campeonato_piauiense: [621],
      campeonato_sergipano: [626],
      campeonato_paraense: [627],
      campeonato_amazonense: [522],
      campeonato_acreano: [520],
      campeonato_amapaense: [521],
      campeonato_rondoniense: [615],
      campeonato_roraimense: [607],
      campeonato_tocantinense: [631],
    };

    if (estadualSlugs[slug]) {
      return { url: this.PB_ESTADUAIS, slug, name: 'PocketBase Estaduais' };
    }

    for (const [key, ids] of Object.entries(estadualSlugs)) {
      if (ids.includes(id)) {
        return { url: this.PB_ESTADUAIS, slug: key, name: 'PocketBase Estaduais' };
      }
    }

    // Se não for nem Brasil, nem Europa, nem Estadual mapeado, retorna NULL (SEM FALLBACK CEGO)
    return null;
  }

  /**
   * Dispara notificação push broadcast para a instância PocketBase correspondente
   */
  async sendBroadcast(dto: BroadcastPushDto) {
    const target = this.resolvePocketBaseTarget(dto.leagueId, dto.appSlug);
    if (!target) {
      this.logger.warn(`📢 Disparo de Push cancelado: Nenhuma instância PocketBase mapeada para a liga ${dto.leagueId} / slug ${dto.appSlug}`);
      return {
        success: false,
        message: `Nenhuma instância do PocketBase mapeada para a competição ${dto.leagueId || dto.appSlug}. Disparo cancelado para evitar desvio de rota.`,
      };
    }

    this.logger.log(`📢 Disparando Broadcast Push para [${target.name}] (AppSlug: ${target.slug})`);

    const payload = {
      appSlug: target.slug,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl || '',
      dataPayload: dto.dataPayload || { app_slug: target.slug },
    };

    try {
      const response = await axios.post(`${target.url}/api/broadcast-push`, payload, { timeout: 15000 });
      return {
        success: true,
        target: target.name,
        appSlug: target.slug,
        details: response.data,
      };
    } catch (err: any) {
      this.logger.error(`❌ Erro ao disparar push no ${target.name}: ${err.message}`);
      return {
        success: false,
        target: target.name,
        appSlug: target.slug,
        error: err.response?.data?.error || err.message,
      };
    }
  }

  /**
   * Gera o resumo conciso e direto de placares da última rodada finalizada de uma liga
   */
  async getRoundSummary(leagueId: number, season: number = 2026) {
    try {
      const fixtures = await this.prisma.fixture.findMany({
        where: {
          league: { externalId: Number(leagueId) },
          season: Number(season),
          statusShort: { in: ['FT', 'AET', 'PEN', '1H', '2H', 'HT', 'LIVE'] },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          date: 'desc',
        },
        take: 50,
      });

      if (!fixtures || fixtures.length === 0) {
        return { success: false, message: 'Nenhuma partida finalizada recente encontrada para esta liga.' };
      }

      // Agrupa por rodada (round)
      const roundsMap: Record<string, any[]> = {};
      fixtures.forEach((f) => {
        const roundName = f.round || 'Rodada Atual';
        if (!roundsMap[roundName]) roundsMap[roundName] = [];
        roundsMap[roundName].push(f);
      });

      // Encontra a rodada mais recente que possui jogos realizados
      const latestRound = Object.keys(roundsMap)[0];
      const roundFixtures = roundsMap[latestRound];

      const finishedMatches = roundFixtures.filter((f) => ['FT', 'AET', 'PEN'].includes(f.statusShort || f.status)).length;
      const isCompleted = finishedMatches > 0 && finishedMatches === roundFixtures.length;

      // Formata nome amigável da rodada (ex: Regular Season - 23 -> 23ª Rodada)
      const formattedRound = latestRound.replace(/Regular Season - (\d+)/i, '$1ª Rodada').replace(/Round (\d+)/i, '$1ª Rodada');

      const scoresList = roundFixtures
        .filter((f) => ['FT', 'AET', 'PEN'].includes(f.statusShort || f.status))
        .map((f) => {
          const hName = f.homeTeam?.name || 'Mandante';
          const aName = f.awayTeam?.name || 'Visitante';
          const hScore = f.homeGoals ?? 0;
          const aScore = f.awayGoals ?? 0;
          return `${hName} ${hScore}x${aScore} ${aName}`;
        })
        .join(' | ');

      return {
        success: true,
        round: formattedRound,
        isCompleted,
        totalMatches: roundFixtures.length,
        finishedMatches: finishedMatches,
        suggestedTitle: isCompleted ? `🏁 Fim da ${formattedRound}` : `⚽ Resultados da ${formattedRound}`,
        suggestedBody: scoresList || 'Confira todos os lances e estatísticas completas no aplicativo.',
      };
    } catch (e: any) {
      this.logger.error(`Erro ao gerar resumo da rodada: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Monitora jogos que começam em breve (< 60 min) com escalações confirmadas
   */
  async getLineupAlerts(leagueId?: number) {
    try {
      const now = new Date();
      const in60Min = new Date(now.getTime() + 60 * 60 * 1000);

      const whereClause: any = {
        date: {
          gte: now,
          lte: in60Min,
        },
        status: 'NS',
      };

      if (leagueId) {
        whereClause.league = { externalId: Number(leagueId) };
      }

      const upcomingFixtures = await this.prisma.fixture.findMany({
        where: whereClause,
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
      });

      return {
        success: true,
        count: upcomingFixtures.length,
        fixtures: upcomingFixtures.map((f) => ({
          fixtureId: f.externalId,
          leagueId: f.leagueId,
          leagueName: f.league?.name,
          homeTeam: f.homeTeam?.name,
          awayTeam: f.awayTeam?.name,
          date: f.date,
          suggestedTitle: `📋 Escalações Confirmadas: ${f.homeTeam?.name} x ${f.awayTeam?.name}!`,
          suggestedBody: `Confira os 11 titulares de cada time no aplicativo antes da bola rolar.`,
        })),
      };
    } catch (e: any) {
      this.logger.error(`Erro ao buscar alertas de escalação: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Enfileira o resumo de placares de uma rodada finalizada para aprovação do operador
   * e agenda o disparo automático de fallback para +60 minutos.
   */
  /**
   * Enfileira o resumo de placares de uma rodada finalizada para aprovação do operador
   * e agenda o disparo automático de fallback para +60 minutos.
   */
  async enqueueRoundSummary(leagueId: number, season: number = 2026) {
    try {
      const summary = await this.getRoundSummary(leagueId, season);
      if (!summary.success || !summary.round) {
        return { success: false, message: summary.message || 'Não foi possível compilar o resumo da rodada.' };
      }

      const target = this.resolvePocketBaseTarget(leagueId);
      if (!target) {
        return {
          success: false,
          message: `Nenhum app PocketBase mapeado para a liga ${leagueId}. Resumo de rodada não enfileirado para preservar escopo.`,
        };
      }
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // Nova régua: 10m no total para operador agir; auto-disparo automático caso zere
      const scheduledAutoDispatchAt = new Date(Date.now() + 10 * 60 * 1000);

      // 1. Verificação de Idempotência Estrita: não enfileira se já existir notificação recente (incluindo CANCELLED)
      let existing: any = null;
      if (this.hasPushQueueTable) {
        try {
          existing = await this.prisma.pushQueue.findFirst({
            where: {
              leagueId: Number(leagueId),
              round: summary.round,
              createdAt: { gte: twentyFourHoursAgo },
              status: { in: ['PENDING_APPROVAL', 'DISPATCHED_OPERATOR', 'DISPATCHED_AUTO', 'CANCELLED'] },
            },
          });
        } catch (dbErr: any) {
          if (dbErr.message?.includes('does not exist')) {
            this.hasPushQueueTable = false;
          }
        }
      }

      if (!this.hasPushQueueTable) {
        existing = this.inMemoryPushQueue.find(
          (q) =>
            q.leagueId === Number(leagueId) &&
            q.round === summary.round &&
            q.createdAt >= twentyFourHoursAgo &&
            ['PENDING_APPROVAL', 'DISPATCHED_OPERATOR', 'DISPATCHED_AUTO', 'CANCELLED'].includes(q.status)
        );
      }

      if (existing) {
        return {
          success: true,
          message: 'Resumo já enfileirado, despachado ou descartado para esta rodada.',
          queueItem: existing,
        };
      }

      let queueItem: any = null;
      if (this.hasPushQueueTable) {
        try {
          queueItem = await this.prisma.pushQueue.create({
            data: {
              leagueId: Number(leagueId),
              appSlug: target.slug,
              round: summary.round,
              title: summary.suggestedTitle || `🏁 Fim da ${summary.round}`,
              body: summary.suggestedBody || 'Confira os resultados completos no app!',
              status: 'PENDING_APPROVAL',
              scheduledAutoDispatchAt,
              target: target.name,
            },
          });
        } catch (createErr: any) {
          if (createErr.message?.includes('does not exist')) {
            this.hasPushQueueTable = false;
          }
        }
      }

      if (!this.hasPushQueueTable) {
        const now = new Date();
        queueItem = {
          id: randomUUID(),
          leagueId: Number(leagueId),
          appSlug: target.slug,
          round: summary.round,
          title: summary.suggestedTitle || `🏁 Fim da ${summary.round}`,
          body: summary.suggestedBody || 'Confira os resultados completos no app!',
          imageUrl: null,
          status: 'PENDING_APPROVAL',
          detectedAt: now,
          scheduledAutoDispatchAt,
          dispatchedAt: null,
          sentCount: 0,
          target: target.name,
          createdAt: now,
          updatedAt: now,
        };
        this.inMemoryPushQueue.unshift(queueItem);
      }

      this.logger.log(`[Push Queue] 📥 Resumo enfileirado para [${target.name}] (${summary.round}). Janela operador 10m (auto-disparo ao zerar em ${scheduledAutoDispatchAt.toISOString()})`);

      return {
        success: true,
        message: 'Resumo enfileirado com sucesso. Aguardando operador (10m) ou auto-disparo ao zerar.',
        queueItem,
      };
    } catch (e: any) {
      this.logger.error(`Erro ao enfileirar resumo da rodada: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Consulta a fila de notificações com prioridade para as pendentes
   */
  async getQueue(status?: string) {
    try {
      if (this.hasPushQueueTable) {
        try {
          const whereClause = status ? { status } : {};
          const items = await this.prisma.pushQueue.findMany({
            where: whereClause,
            orderBy: [
              { status: 'asc' },
              { scheduledAutoDispatchAt: 'asc' },
            ],
            take: 50,
          });

          return {
            success: true,
            count: items.length,
            items,
          };
        } catch (dbErr: any) {
          if (dbErr.message?.includes('does not exist')) {
            this.hasPushQueueTable = false;
          }
        }
      }

      // Fallback transparente em memória
      let filtered = [...this.inMemoryPushQueue];
      if (status) {
        filtered = filtered.filter((i) => i.status === status);
      }
      filtered.sort((a, b) => {
        if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
        if (a.status !== 'PENDING_APPROVAL' && b.status === 'PENDING_APPROVAL') return 1;
        return a.scheduledAutoDispatchAt.getTime() - b.scheduledAutoDispatchAt.getTime();
      });

      return {
        success: true,
        count: filtered.length,
        items: filtered.slice(0, 50),
      };
    } catch (e: any) {
      this.logger.warn(`PushQueue not available: ${e.message}`);
      return { success: true, count: 0, items: [] };
    }
  }

  /**
   * Disparo imediato aprovado pelo operador no AdminPanel
   */
  async dispatchQueueItem(id: string, operatorOverride?: { title?: string; body?: string; imageUrl?: string }) {
    try {
      let item: any = null;
      if (this.hasPushQueueTable) {
        try {
          item = await this.prisma.pushQueue.findUnique({ where: { id } });
        } catch (e: any) {
          if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }
      if (!this.hasPushQueueTable) {
        item = this.inMemoryPushQueue.find((q) => q.id === id);
      }

      if (!item) {
        return { success: false, message: 'Item da fila não encontrado.' };
      }

      if (item.status !== 'PENDING_APPROVAL') {
        return { success: false, message: `Item já finalizado com status: ${item.status}` };
      }

      const finalTitle = operatorOverride?.title || item.title;
      const finalBody = operatorOverride?.body || item.body;
      const finalImage = operatorOverride?.imageUrl !== undefined ? operatorOverride.imageUrl : (item.imageUrl || '');

      const broadcastResult = await this.sendBroadcast({
        leagueId: item.leagueId,
        appSlug: item.appSlug,
        title: finalTitle,
        body: finalBody,
        imageUrl: finalImage,
        dataPayload: {
          app_slug: item.appSlug,
          league_id: String(item.leagueId),
          type: 'round_summary',
          round: item.round,
        },
      });

      let updated: any = null;
      if (this.hasPushQueueTable) {
        try {
          updated = await this.prisma.pushQueue.update({
            where: { id },
            data: {
              title: finalTitle,
              body: finalBody,
              imageUrl: finalImage,
              status: 'DISPATCHED_OPERATOR',
              dispatchedAt: new Date(),
              sentCount: broadcastResult.details?.sentCount || 0,
              target: broadcastResult.target || item.target,
            },
          });
        } catch (e: any) {
          if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }
      if (!this.hasPushQueueTable) {
        item.title = finalTitle;
        item.body = finalBody;
        item.imageUrl = finalImage;
        item.status = 'DISPATCHED_OPERATOR';
        item.dispatchedAt = new Date();
        item.sentCount = broadcastResult.details?.sentCount || 0;
        item.target = broadcastResult.target || item.target;
        item.updatedAt = new Date();
        updated = item;
      }

      this.logger.log(`[Push Queue] 👤 Item ${id} disparado manualmente pelo operador via ${broadcastResult.target}`);

      return {
        success: true,
        broadcastResult,
        queueItem: updated,
      };
    } catch (e: any) {
      this.logger.error(`Erro ao disparar item da fila ${id}: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Cancelamento/descarte do disparo pelo operador
   */
  async cancelQueueItem(id: string) {
    try {
      let item: any = null;
      if (this.hasPushQueueTable) {
        try {
          item = await this.prisma.pushQueue.findUnique({ where: { id } });
        } catch (e: any) {
          if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }
      if (!this.hasPushQueueTable) {
        item = this.inMemoryPushQueue.find((q) => q.id === id);
      }

      if (!item) {
        return { success: false, message: 'Item não encontrado.' };
      }

      let updated: any = null;
      if (this.hasPushQueueTable) {
        try {
          updated = await this.prisma.pushQueue.update({
            where: { id },
            data: { status: 'CANCELLED' },
          });
        } catch (e: any) {
          if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }
      if (!this.hasPushQueueTable) {
        item.status = 'CANCELLED';
        item.updatedAt = new Date();
        updated = item;
      }

      this.logger.log(`[Push Queue] ❌ Item ${id} cancelado pelo operador.`);
      return { success: true, queueItem: updated };
    } catch (e: any) {
      this.logger.error(`Erro ao cancelar item ${id}: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Atualização de título/mensagem do item antes do disparo
   */
  async updateQueueItem(id: string, dto: { title?: string; body?: string; imageUrl?: string }) {
    try {
      let item: any = null;
      if (this.hasPushQueueTable) {
        try {
          item = await this.prisma.pushQueue.findUnique({ where: { id } });
        } catch (e: any) {
          if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }
      if (!this.hasPushQueueTable) {
        item = this.inMemoryPushQueue.find((q) => q.id === id);
      }

      if (!item || item.status !== 'PENDING_APPROVAL') {
        return { success: false, message: 'Item não encontrado ou não está pendente de aprovação.' };
      }

      let updated: any = null;
      if (this.hasPushQueueTable) {
        try {
          updated = await this.prisma.pushQueue.update({
            where: { id },
            data: {
              title: dto.title !== undefined ? dto.title : item.title,
              body: dto.body !== undefined ? dto.body : item.body,
              imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : item.imageUrl,
            },
          });
        } catch (e: any) {
          if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }
      if (!this.hasPushQueueTable) {
        if (dto.title !== undefined) item.title = dto.title;
        if (dto.body !== undefined) item.body = dto.body;
        if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;
        item.updatedAt = new Date();
        updated = item;
      }

      return { success: true, queueItem: updated };
    } catch (e: any) {
      this.logger.error(`Erro ao atualizar item ${id}: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Processador de Fallback Autônomo:
   * Dispara automaticamente itens da fila com status PENDING_APPROVAL que tenham ultrapassado os 60 minutos
   */
  async processPendingAutoDispatches() {
    const now = new Date();
    try {
      let expiredItems: any[] = [];
      if (this.hasPushQueueTable) {
        try {
          expiredItems = await this.prisma.pushQueue.findMany({
            where: {
              status: 'PENDING_APPROVAL',
              scheduledAutoDispatchAt: { lte: now },
            },
          });
        } catch (dbErr: any) {
          if (dbErr.message?.includes('does not exist')) {
            this.hasPushQueueTable = false;
          }
        }
      }

      if (!this.hasPushQueueTable) {
        expiredItems = this.inMemoryPushQueue.filter(
          (i) => i.status === 'PENDING_APPROVAL' && i.scheduledAutoDispatchAt <= now
        );
      }

      if (!expiredItems || expiredItems.length === 0) {
        return { processedCount: 0 };
      }

      this.logger.log(`[AutoDispatch Worker] ⏰ Encontrados ${expiredItems.length} itens pendentes de auto-disparo (janela de 10m expirada).`);

      let processedCount = 0;
      for (const item of expiredItems) {
        try {
          const broadcastResult = await this.sendBroadcast({
            leagueId: item.leagueId,
            appSlug: item.appSlug,
            title: item.title,
            body: item.body,
            imageUrl: item.imageUrl || '',
            dataPayload: {
              app_slug: item.appSlug,
              league_id: String(item.leagueId),
              type: 'round_summary',
              round: item.round,
              source: 'sentinel_auto_fallback',
            },
          });

          if (this.hasPushQueueTable) {
            try {
              await this.prisma.pushQueue.update({
                where: { id: item.id },
                data: {
                  status: 'DISPATCHED_AUTO',
                  dispatchedAt: new Date(),
                  sentCount: broadcastResult.details?.sentCount || 0,
                  target: broadcastResult.target || item.target,
                },
              });
            } catch (e: any) {
              if (e.message?.includes('does not exist')) this.hasPushQueueTable = false;
            }
          }

          if (!this.hasPushQueueTable) {
            const memoryTarget = this.inMemoryPushQueue.find((q) => q.id === item.id);
            if (memoryTarget) {
              memoryTarget.status = 'DISPATCHED_AUTO';
              memoryTarget.dispatchedAt = new Date();
              memoryTarget.sentCount = broadcastResult.details?.sentCount || 0;
              memoryTarget.target = broadcastResult.target || item.target;
              memoryTarget.updatedAt = new Date();
            }
          }

          this.logger.log(`[AutoDispatch Worker] 🚀 Auto-disparo executado com sucesso para ${item.round} (Liga ${item.leagueId}). Entregues: ${broadcastResult.details?.sentCount || 0}`);
          processedCount++;
        } catch (itemErr: any) {
          this.logger.error(`[AutoDispatch Worker] Falha no auto-disparo do item ${item.id}: ${itemErr.message}`);
        }
      }

      return { processedCount };
    } catch (err: any) {
      if (err.message?.includes('does not exist')) {
        this.logger.debug?.(`[AutoDispatch Worker] Tabela PushQueue não provisionada no PostgreSQL. Ignorando.`);
      } else {
        this.logger.error(`[AutoDispatch Worker] Erro no processamento de auto-disparo: ${err.message}`);
      }
      return { processedCount: 0, error: err.message };
    }
  }

  // Controle de estado para escalações sem necessidade de alteração de schema no PostgreSQL
  private readonly dispatchedLineupMap = new Map<number, Date>();
  private readonly dismissedLineupSet = new Set<number>();

  /**
   * Retorna todas as partidas do dia atual (00:00 às 23:59 BRT) para todas as competições monitoradas,
   * indicando se as escalações (22 titulares) estão gravadas, a fonte da ingestão (ESPN, PB, etc.),
   * status de monitoramento e status de disparo do Push Agent.
   */
  async getLineupsDashboard() {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const startBrt = new Date(`${dateStr}T00:00:00-03:00`);
      const endBrt = new Date(`${dateStr}T23:59:59.999-03:00`);

      const monitoredIds = SUPPORTED_COMPETITIONS.map((c) => c.externalId);

      const fixtures = await this.prisma.fixture.findMany({
        where: {
          date: {
            gte: startBrt,
            lte: endBrt,
          },
          league: {
            externalId: { in: monitoredIds },
          },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          lineups: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      let recordedCount = 0;
      let monitoringCount = 0;
      let upcomingCount = 0;

      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

      const enriched = fixtures.map((f) => {
        const homeStarters = f.lineups.filter((l) => l.teamId === f.homeTeam.externalId && l.isStart).length;
        const awayStarters = f.lineups.filter((l) => l.teamId === f.awayTeam.externalId && l.isStart).length;
        const totalStarters = homeStarters + awayStarters;
        const isBothConfirmed = homeStarters >= 11 && awayStarters >= 11;

        // Identifica fonte da escalação
        let lineupSource = 'Pendente';
        if (f.lineups && f.lineups.length > 0) {
          const sample = f.lineups.find((l) => l.playerPhoto)?.playerPhoto || '';
          if (sample.includes('espncdn')) {
            lineupSource = 'ESPN Core API';
          } else if (sample.includes('sofascore')) {
            lineupSource = 'Sofascore';
          } else if (sample.includes('fotmob')) {
            lineupSource = 'FotMob';
          } else if (sample.includes('api-sports')) {
            lineupSource = 'PocketBase / Sync';
          } else if (isBothConfirmed) {
            lineupSource = 'Oficial Confirmado';
          }
        }

        // Determina estado de gravação e ciclo
        let recordingStatus: 'RECORDED' | 'MONITORING' | 'UPCOMING' = 'UPCOMING';
        const matchDate = new Date(f.date);

        if (isBothConfirmed) {
          recordingStatus = 'RECORDED';
          recordedCount++;
        } else if (
          ['1H', '2H', 'HT', 'LIVE'].includes(f.statusShort || '') ||
          (matchDate >= fourHoursAgo && matchDate <= fourHoursFromNow)
        ) {
          recordingStatus = 'MONITORING';
          monitoringCount++;
        } else {
          recordingStatus = 'UPCOMING';
          upcomingCount++;
        }

        const isDispatched = this.dispatchedLineupMap.has(f.externalId);
        const isDismissed = this.dismissedLineupSet.has(f.externalId);

        let status: 'AVAILABLE' | 'WAITING' | 'DISPATCHED' | 'DISMISSED' = 'WAITING';
        if (isDispatched) {
          status = 'DISPATCHED';
        } else if (isDismissed) {
          status = 'DISMISSED';
        } else if (isBothConfirmed) {
          status = 'AVAILABLE';
        }

        const autoDispatchAt = new Date(matchDate.getTime() - 10 * 60 * 1000);
        const target = this.resolvePocketBaseTarget(f.league.externalId);
        const moduleInfo = this.getModuleForLeague(f.league.externalId);

        const suggestedTitle = `📋 Escalações Confirmadas: ${f.homeTeam.name} x ${f.awayTeam.name}!`;
        const suggestedBody = `Escalação disponível. Confira os 11 titulares no aplicativo!`;

        return {
          id: f.id,
          externalId: f.externalId,
          leagueId: f.league.externalId,
          leagueName: f.league.name,
          module: moduleInfo,
          homeTeam: {
            id: f.homeTeam.id,
            externalId: f.homeTeam.externalId,
            name: f.homeTeam.name,
            logo: f.homeTeam.logo,
            startersCount: homeStarters,
          },
          awayTeam: {
            id: f.awayTeam.id,
            externalId: f.awayTeam.externalId,
            name: f.awayTeam.name,
            logo: f.awayTeam.logo,
            startersCount: awayStarters,
          },
          date: f.date,
          venueName: f.venueName,
          statusShort: f.statusShort || 'NS',
          status,
          recordingStatus,
          lineupSource,
          isBothConfirmed,
          totalStarters,
          autoDispatchAt,
          lineupDispatchedAt: this.dispatchedLineupMap.get(f.externalId) || null,
          target: target?.name || 'Não Mapeado',
          appSlug: target?.slug || 'none',
          suggestedTitle,
          suggestedBody,
        };
      });

      return {
        success: true,
        totalMatchesToday: fixtures.length,
        recordedMatchesToday: recordedCount,
        monitoringMatchesToday: monitoringCount,
        upcomingMatchesToday: upcomingCount,
        dispatchedPushesToday: this.dispatchedLineupMap.size,
        count: enriched.length,
        fixtures: enriched,
      };
    } catch (e: any) {
      this.logger.error(`Erro ao buscar dashboard de escalações: ${e.message}`);
      return { success: false, error: e.message, fixtures: [] };
    }
  }

  /**
   * Disparo de alerta de escalação com trava anti-duplicação
   */
  async dispatchLineupAlert(fixtureId: number, override?: { title?: string; body?: string; imageUrl?: string }) {
    try {
      const fixture = await this.prisma.fixture.findFirst({
        where: { externalId: Number(fixtureId) },
        include: { homeTeam: true, awayTeam: true, league: true },
      });

      if (!fixture) {
        return { success: false, message: 'Partida não encontrada.' };
      }

      if (this.dispatchedLineupMap.has(fixture.externalId)) {
        return {
          success: false,
          message: `Alerta de escalação já disparado anteriormente para esta partida em ${this.dispatchedLineupMap.get(fixture.externalId)?.toISOString()}.`,
        };
      }

      const target = this.resolvePocketBaseTarget(fixture.league.externalId);
      if (!target) {
        this.logger.warn(
          `[Lineup Push] Nenhuma instância PocketBase configurada para a liga ${fixture.league.externalId} (${fixture.league.name}). Push cancelado para preservar isolamento.`,
        );
        return {
          success: false,
          message: `Nenhum app PocketBase configurado para a liga ${fixture.league.name} (${fixture.league.externalId}).`,
        };
      }
      const title = override?.title || `📋 Escalações Confirmadas: ${fixture.homeTeam.name} x ${fixture.awayTeam.name}!`;
      const body = override?.body || 'Escalação disponível. Confira os 11 titulares no aplicativo!';
      const imageUrl = override?.imageUrl || '';

      const broadcastResult = await this.sendBroadcast({
        leagueId: fixture.league.externalId,
        appSlug: target.slug,
        title,
        body,
        imageUrl,
        dataPayload: {
          app_slug: target.slug,
          type: 'fixture',
          fixture_id: String(fixture.externalId),
          tab: 'lineups',
          league_id: String(fixture.league.externalId),
        },
      });

      this.dispatchedLineupMap.set(fixture.externalId, new Date());

      this.logger.log(`[Lineup Push] 🚀 Alerta de escalação disparado para ${fixture.homeTeam.name} x ${fixture.awayTeam.name} (${target.name})`);

      return {
        success: true,
        broadcastResult,
        dispatchedAt: this.dispatchedLineupMap.get(fixture.externalId),
      };
    } catch (e: any) {
      this.logger.error(`Erro ao disparar alerta de escalação: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Descarta alerta de escalação para que não fique pendente
   */
  async dismissLineupAlert(fixtureId: number) {
    try {
      this.dismissedLineupSet.add(Number(fixtureId));
      return { success: true, message: 'Alerta de escalação descartado com sucesso.' };
    } catch (e: any) {
      this.logger.error(`Erro ao descartar alerta de escalação: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  /**
   * Dashboard Global de Resumo de Rodadas:
   * Agrupa todas as competições que têm jogos no dia atual (today em BRT)
   * separando em concluídas (100% FT) e em andamento.
   */
  async getRoundsDashboard() {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const startBrt = new Date(`${dateStr}T00:00:00-03:00`);
      const endBrt = new Date(`${dateStr}T23:59:59.999-03:00`);

      const CUP_LEAGUE_IDS = [13, 73, 612, 1, 10];
      const monitoredIds = SUPPORTED_COMPETITIONS
        .map((c) => c.externalId)
        .filter((id) => !CUP_LEAGUE_IDS.includes(id));

      const fixturesToday = await this.prisma.fixture.findMany({
        where: {
          date: {
            gte: startBrt,
            lte: endBrt,
          },
          league: {
            externalId: { in: monitoredIds },
          },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      const leaguesMap: Record<number, any> = {};
      for (const f of fixturesToday) {
        const lid = f.league.externalId;
        const target = this.resolvePocketBaseTarget(lid);
        if (!target) continue; // Garante isolamento restrito a Europa, Brasil e Estaduais

        if (!leaguesMap[lid]) {
          const compConfig = SUPPORTED_COMPETITIONS.find((c) => c.externalId === lid);
          const moduleInfo = this.getModuleForLeague(lid);
          leaguesMap[lid] = {
            leagueId: lid,
            leagueName: compConfig?.name || f.league.name,
            country: compConfig?.country || f.league.country,
            module: moduleInfo,
            target: target.name,
            appSlug: target.slug,
            fixtures: [],
          };
        }
        leaguesMap[lid].fixtures.push(f);
      }

      let queueItems: any[] = [];
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (this.hasPushQueueTable) {
        try {
          queueItems = await this.prisma.pushQueue.findMany({
            where: {
              createdAt: { gte: twentyFourHoursAgo },
            },
          });
        } catch (qErr: any) {
          if (qErr.message?.includes('does not exist')) this.hasPushQueueTable = false;
        }
      }

      if (!this.hasPushQueueTable) {
        queueItems = this.inMemoryPushQueue.filter((q) => q.createdAt >= twentyFourHoursAgo);
      }

      const completedLeagues: any[] = [];
      const inProgressLeagues: any[] = [];

      for (const lidStr of Object.keys(leaguesMap)) {
        const item = leaguesMap[Number(lidStr)];
        const fixtures = item.fixtures;
        const total = fixtures.length;
        const finished = fixtures.filter((f: any) => ['FT', 'AET', 'PEN'].includes(f.statusShort || f.status)).length;
        const live = fixtures.filter((f: any) => ['1H', '2H', 'HT', 'LIVE'].includes(f.statusShort || f.status)).length;
        const scheduled = fixtures.filter((f: any) => ['NS', 'TBD'].includes(f.statusShort || f.status)).length;

        const isCompleted = total > 0 && finished === total;
        const queueItem = queueItems.find((q) => q.leagueId === item.leagueId);

        const roundRaw = fixtures[0]?.round || 'Rodada Atual';
        const formattedRound = roundRaw.replace(/Regular Season - (\d+)/i, '$1ª Rodada').replace(/Round (\d+)/i, '$1ª Rodada');

        const leagueData = {
          ...item,
          round: formattedRound,
          totalMatches: total,
          finishedMatches: finished,
          liveMatches: live,
          scheduledMatches: scheduled,
          isCompleted,
          queueItem: queueItem || null,
          suggestedTitle: isCompleted ? `🏁 Fim dos Jogos de Hoje!` : `⚽ Jogos da ${formattedRound}`,
          suggestedBody: isCompleted
            ? `Todos os confrontos do dia foram finalizados. Confira a classificação e os resultados atualizados no app!`
            : `Acompanhe todos os lances e estatísticas em tempo real no aplicativo.`,
        };

        if (isCompleted) {
          completedLeagues.push(leagueData);
        } else {
          inProgressLeagues.push(leagueData);
        }
      }

      return {
        success: true,
        todayTotalLeagues: Object.keys(leaguesMap).length,
        completedLeagues,
        inProgressLeagues,
      };
    } catch (e: any) {
      this.logger.error(`Erro ao buscar dashboard de rodadas: ${e.message}`);
      return { success: false, error: e.message, completedLeagues: [], inProgressLeagues: [] };
    }
  }

  /**
   * Worker de Auto-Disparo de Escalações (executado a cada 1 min):
   * Dispara o push imediatamente assim que ambos os times possuírem 11 titulares confirmados,
   * desde que ainda faltem no mínimo 10 minutos para o início da partida (cutoff de segurança).
   */
  async processPendingLineupDispatches() {
    try {
      const now = new Date();
      // Busca partidas do dia que ainda não iniciaram (de 2h atrás para cobrir atrasos até 12h à frente)
      const windowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + 12 * 60 * 60 * 1000);

      // Monitora exclusivamente Europa, Brasil e Estaduais (Copas estritamente excluídas do auto-disparo)
      const monitoredIds = SUPPORTED_COMPETITIONS
        .map((c) => c.externalId)
        .filter((id) => ![13, 73, 612, 1, 10].includes(id));

      const candidateFixtures = await this.prisma.fixture.findMany({
        where: {
          date: {
            gte: windowStart,
            lte: windowEnd,
          },
          league: {
            externalId: { in: monitoredIds },
          },
          statusShort: { in: ['NS', 'TBD'] },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          lineups: true,
        },
      });

      if (!candidateFixtures || candidateFixtures.length === 0) {
        return { processedCount: 0 };
      }

      const undispatchedCandidates = candidateFixtures.filter(
        (f) => !this.dispatchedLineupMap.has(f.externalId) && !this.dismissedLineupSet.has(f.externalId),
      );

      let processedCount = 0;
      for (const f of undispatchedCandidates) {
        const homeStarters = f.lineups.filter((l) => l.teamId === f.homeTeam.externalId && l.isStart).length;
        const awayStarters = f.lineups.filter((l) => l.teamId === f.awayTeam.externalId && l.isStart).length;

        if (homeStarters >= 11 && awayStarters >= 11) {
          const matchDate = new Date(f.date);
          const minutesUntilKickoff = (matchDate.getTime() - now.getTime()) / (60 * 1000);

          // Trava de segurança: só dispara se ainda faltarem pelo menos 10 minutos para o início
          if (minutesUntilKickoff >= 10) {
            this.logger.log(
              `[AutoLineup Worker] ⚡ Disparando push imediato de escalações confirmadas (${Math.round(minutesUntilKickoff)} min antes) para ${f.homeTeam.name} x ${f.awayTeam.name}`,
            );
            await this.dispatchLineupAlert(f.externalId);
            processedCount++;
          } else {
            this.logger.warn(
              `[AutoLineup Worker] ⛔ Cutoff atingido (< 10 min para início: ${Math.round(minutesUntilKickoff)} min). Push ignorado para ${f.homeTeam.name} x ${f.awayTeam.name}`,
            );
            // Marca como dismissed para não checar novamente em loop
            this.dismissedLineupSet.add(f.externalId);
          }
        }
      }

      return { processedCount };
    } catch (e: any) {
      this.logger.error(`[AutoLineup Worker] Erro ao processar auto-disparo de escalações: ${e.message}`);
      return { processedCount: 0, error: e.message };
    }
  }
}

