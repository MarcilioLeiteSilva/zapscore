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
    // TRAVA ABSOLUTA: gera exatamente 1 comentário de balanço no intervalo. Enquanto status for HT, nada mais é gerado.
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

    // 3. CASO FIM DE JOGO: Status FT / AET / PEN
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

    // 4. CASO 1º TEMPO (1H): Dois momentos bem definidos (Início e Meio)
    if (status === '1H') {
      // 4.1 Início do 1º Tempo (Janela dos 5' aos 18')
      const has1HStart = existingComments.some(
        (c) => c.phase === 'FIRST_HALF' && (c.minute || 0) <= 20,
      );
      if (!has1HStart && elapsed >= 5 && elapsed <= 20) {
        this.logger.log(
          `[TacticalScheduler] ⏱️ Gerando Início do 1º Tempo (${elapsed}') para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: 'FIRST_HALF',
          minute: elapsed,
        });
        return;
      }

      // 4.2 Durante o 1º Tempo (Janela dos 25' aos 40')
      const has1HMid = existingComments.some(
        (c) => c.phase === 'FIRST_HALF' && (c.minute || 0) > 20 && (c.minute || 0) < 45,
      );
      if (!has1HMid && elapsed >= 25 && elapsed <= 42) {
        this.logger.log(
          `[TacticalScheduler] ⚽ Gerando Meio do 1º Tempo (${elapsed}') para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: 'FIRST_HALF',
          minute: elapsed,
        });
        return;
      }

      // Trava de segurança: entre 43' e acréscimos do 1º tempo, não gera comentário para esperar o HT
      return;
    }

    // 5. CASO 2º TEMPO (2H): Só roda quando detectar que começou o 2º tempo (status == '2H')
    if (status === '2H' || (status === 'LIVE' && elapsed > 45)) {
      // 5.1 Início do 2º Tempo (Janela dos 47' aos 60')
      const has2HStart = existingComments.some(
        (c) => c.phase === 'SECOND_HALF' && (c.minute || 0) <= 60,
      );
      if (!has2HStart && elapsed >= 47 && elapsed <= 62) {
        this.logger.log(
          `[TacticalScheduler] 🔄 Gerando Início do 2º Tempo (${elapsed}') para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: 'SECOND_HALF',
          minute: elapsed,
        });
        return;
      }

      // 5.2 Durante o 2º Tempo (Janela dos 68' aos 82')
      const has2HMid = existingComments.some(
        (c) => c.phase === 'SECOND_HALF' && (c.minute || 0) > 60 && (c.minute || 0) < 88,
      );
      if (!has2HMid && elapsed >= 68 && elapsed <= 84) {
        this.logger.log(
          `[TacticalScheduler] ⚡ Gerando Meio/Reta Final do 2º Tempo (${elapsed}') para ${fixture.homeTeam.name} x ${fixture.awayTeam.name}`,
        );
        await this.tacticalCommentsService.generateTacticalComment(fixtureId, {
          phase: 'SECOND_HALF',
          minute: elapsed,
        });
        return;
      }

      // Após os 85', aguarda o apito final (FT) para gerar o resumo completo
      return;
    }
  }
}
