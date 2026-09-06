import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TacticalCommentsService } from './tactical-comments.service';
import { PocketbaseCommentsClient } from './providers/pocketbase-comments.client';

@Injectable()
export class TacticalCommentsSchedulerService {
  private readonly logger = new Logger(TacticalCommentsSchedulerService.name);

  // Ligas homologadas: Brasileirão Série A (71) e Série B (72)
  private readonly TARGET_LEAGUES = [71, 72];

  // Trava para evitar sobreposição de execuções
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tacticalCommentsService: TacticalCommentsService,
    private readonly pbCommentsClient: PocketbaseCommentsClient,
  ) {}

  /**
   * Executa a cada 5 minutos em segundo plano
   * Cadência ideal para monitoramento e geração tática de alto valor
   */
  @Cron('*/5 * * * *')
  async handleTacticalCommentsCron() {
    const isEnabled = this.configService.get<string>('ENABLE_TACTICAL_COMMENTS_CRON', 'true') === 'true';
    if (!isEnabled) {
      return;
    }

    if (this.isRunning) {
      this.logger.debug('[TacticalScheduler] Ciclo anterior ainda em execução. Pulando...');
      return;
    }

    this.isRunning = true;

    try {
      await this.processTacticalCycle();
    } catch (err: any) {
      this.logger.error(`[TacticalScheduler] Erro no ciclo de comentários táticos: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Processa todas as partidas ativas do Brasileirão Série A e B
   */
  private async processTacticalCycle() {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h atrás
    const windowEnd = new Date(now.getTime() + 50 * 60 * 1000); // próximas 50min

    // Busca partidas das ligas homologadas dentro da janela temporal ativa
    const activeFixtures = await this.prisma.fixture.findMany({
      where: {
        league: { externalId: { in: this.TARGET_LEAGUES } },
        OR: [
          // 1. Partidas rolando ao vivo ou intervalo
          { statusShort: { in: ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'] } },
          // 2. Partidas que iniciam em breve (para gerar pré-jogo)
          {
            statusShort: { in: ['NS', 'TBD'] },
            date: { gte: now, lte: windowEnd },
          },
          // 3. Partidas recém-encerradas (para gerar resumo final)
          {
            statusShort: { in: ['FT', 'AET', 'PEN'] },
            updatedAt: { gte: windowStart },
          },
        ],
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true,
      },
      take: 20,
    });

    if (activeFixtures.length === 0) {
      return;
    }

    this.logger.log(
      `[TacticalScheduler] 🔄 Avaliando ${activeFixtures.length} partida(s) do Brasileirão A/B para comentários táticos...`,
    );

    for (const fixture of activeFixtures) {
      try {
        await this.evaluateFixture(fixture, now);
      } catch (err: any) {
        this.logger.warn(
          `[TacticalScheduler] Falha ao processar fixture ${fixture.externalId} (${fixture.homeTeam.name} x ${fixture.awayTeam.name}): ${err.message}`,
        );
      }
    }
  }

  /**
   * Avalia uma partida individualmente e decide se deve gerar comentário
   */
  private async evaluateFixture(fixture: any, now: Date) {
    const fixtureId = fixture.externalId;
    const status = fixture.statusShort || 'NS';
    const elapsed = fixture.elapsed || 0;

    // Busca os comentários já gravados no PocketBase para esta partida
    const existingComments = await this.pbCommentsClient.getCommentsByFixture(fixtureId);

    // 1. CASO PRÉ-JOGO: Partida agendada para os próximos 45 minutos
    if (['NS', 'TBD'].includes(status)) {
      const matchTime = new Date(fixture.date).getTime();
      const diffMinutes = (matchTime - now.getTime()) / (1000 * 60);

      // Se começa em até 45 minutos e ainda NÃO tem comentário PRE_MATCH
      if (diffMinutes <= 45 && diffMinutes >= -5) {
        const hasPreMatch = existingComments.some((c) => c.phase === 'PRE_MATCH');
        if (!hasPreMatch) {
          this.logger.log(
            `[TacticalScheduler] 📢 Gerando Pré-Jogo automático para ${fixture.homeTeam.name} x ${fixture.awayTeam.name} (inicia em ${Math.round(diffMinutes)}m)`,
          );
          await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
            phase: 'PRE_MATCH',
            minute: 0,
          });
        }
      }
      return;
    }

    // 2. CASO INTERVALO: Status HT
    if (status === 'HT') {
      const hasHalfTime = existingComments.some((c) => c.phase === 'HALF_TIME');
      if (!hasHalfTime) {
        this.logger.log(
          `[TacticalScheduler] ⏸️ Gerando Análise de Intervalo para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: 'HALF_TIME',
          minute: 45,
        });
      }
      return;
    }

    // 3. CASO FIM DE JOGO: Status FT
    if (['FT', 'AET', 'PEN'].includes(status)) {
      const hasFullTime = existingComments.some((c) => c.phase === 'FULL_TIME');
      if (!hasFullTime) {
        this.logger.log(
          `[TacticalScheduler] 🏁 Gerando Resumo Final para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: 'FULL_TIME',
          minute: 90,
        });
      }
      return;
    }

    // 4. CASO AO VIVO: 1º Tempo (1H) ou 2º Tempo (2H)
    if (['1H', '2H', 'LIVE'].includes(status)) {
      const livePhase = status === '1H' ? 'FIRST_HALF' : 'SECOND_HALF';

      // Filtra comentários já feitos durante a partida ao vivo
      const liveComments = existingComments.filter((c) =>
        ['FIRST_HALF', 'SECOND_HALF'].includes(c.phase),
      );

      // Encontra o minuto do último comentário gerado
      let lastCommentMinute = 0;
      for (const c of liveComments) {
        if (c.minute && c.minute > lastCommentMinute) {
          lastCommentMinute = c.minute;
        }
      }

      // Regra dos 5 minutos:
      // Se não houver nenhum comentário ao vivo e o jogo já passou dos 10min, gera o primeiro.
      // Ou se já passaram pelo menos 5 minutos desde o último comentário.
      const shouldGenerate =
        (lastCommentMinute === 0 && elapsed >= 10) ||
        (elapsed >= lastCommentMinute + 5 && elapsed <= 95);

      if (shouldGenerate) {
        this.logger.log(
          `[TacticalScheduler] ⚡ Gerando Leitura Tática ao Vivo (${elapsed}') para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: livePhase,
          minute: elapsed,
        });
      }
    }
  }
}
