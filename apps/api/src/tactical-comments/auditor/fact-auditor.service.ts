import { Injectable, Logger } from '@nestjs/common';

export interface AuditContext {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeRank?: number;
  awayRank?: number;
  homePoints?: number;
  awayPoints?: number;
  playersInMatch?: string[];
  liveLancesText?: string;
  previousTitles?: string[];
}

export interface AuditResult {
  passed: boolean;
  sanitizedTitle: string;
  sanitizedComment: string;
  warnings: string[];
}

@Injectable()
export class FactAuditorService {
  private readonly logger = new Logger(FactAuditorService.name);

  /**
   * Executa auditoria em 3 camadas no comentário gerado pela IA antes da persistência
   */
  auditComment(
    title: string,
    comment: string,
    context: AuditContext,
  ): AuditResult {
    const warnings: string[] = [];
    let sanitizedTitle = title;
    let sanitizedComment = comment;

    // 1. AUDITORIA DE TABELA (G4, Título, Z4, Rebaixamento)
    const tableAudit = this.auditTableConsistency(sanitizedComment, context);
    if (!tableAudit.passed) {
      warnings.push(...tableAudit.warnings);
      sanitizedComment = tableAudit.sanitizedText;
    }

    // 2. AUDITORIA DE PLACAR (Empate vs Vitória vs Goleada)
    const scoreAudit = this.auditScoreConsistency(sanitizedTitle, sanitizedComment, context);
    if (!scoreAudit.passed) {
      warnings.push(...scoreAudit.warnings);
      sanitizedTitle = scoreAudit.sanitizedTitle;
      sanitizedComment = scoreAudit.sanitizedComment;
    }

    // 3. AUDITORIA DE TÍTULO (Não-Repetição e Banimento de Clichês Genéricos)
    const titleAudit = this.auditTitleRepetition(sanitizedTitle, context);
    if (!titleAudit.passed) {
      warnings.push(...titleAudit.warnings);
      sanitizedTitle = titleAudit.sanitizedTitle;
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `[FactAuditor] ⚠️ Inconsistências auditadas e corrigidas para ${context.homeTeam} x ${context.awayTeam}:\n` +
          warnings.map((w) => `  - ${w}`).join('\n'),
      );
    } else {
      this.logger.log(
        `[FactAuditor] ✅ Comentário 100% auditado e aprovado para ${context.homeTeam} x ${context.awayTeam}`,
      );
    }

    return {
      passed: warnings.length === 0,
      sanitizedTitle,
      sanitizedComment,
      warnings,
    };
  }

  /**
   * Audita se o texto atribui disputas de G4/Título/Z4 a clubes fora dessas faixas
   */
  private auditTableConsistency(
    text: string,
    ctx: AuditContext,
  ): { passed: boolean; sanitizedText: string; warnings: string[] } {
    let sanitized = text;
    const warnings: string[] = [];

    const homeRank = ctx.homeRank || 0;
    const awayRank = ctx.awayRank || 0;

    // 1. CASO CRÍTICO: AMBOS OS CLUBES FORA DO G4/G6 (Ex: Corinthians 11º x Chapecoense 20º, Botafogo 12º x Vasco 10º)
    if (homeRank > 6 && awayRank > 6) {
      if (/(?:g-?4|g4)/i.test(sanitized)) {
        warnings.push(
          `Alucinação de tabela detectada: Menção a G4 em partida onde ${ctx.homeTeam} (${homeRank}º) e ${ctx.awayTeam} (${awayRank}º) estão ambos fora do topo. Sanitizando.`,
        );
        sanitized = sanitized.replace(
          /[,;.]?\s*(?:que\s+)?(?:busca|mira|almeja|sonha|briga|luta|disputa|quer|tentando|de olho|alcançar|entrar).*?(?:ao|o|no|pelo|por|com)?\s*g-?4/gi,
          ', que tenta melhorar sua posição na tabela',
        );
        sanitized = sanitized.replace(/\b(?:o\s+)?g-?4\b/gi, 'meio da tabela');
      }
    }

    // 2. UM DOS CLUBES ESTÁ FORA DO G4/G6 (Ex: Botafogo 12º x Palmeiras 2º)
    if (homeRank > 6 || awayRank > 6) {
      // Menção a 'ambos' ou 'as duas equipes' disputando G4
      const ambosG4Regex = /(?:ambos|os dois|as duas equipes|os clubes).*?(?:g-?4|g4)/i;
      if (ambosG4Regex.test(sanitized)) {
        warnings.push(
          `Alucinação de tabela detectada: Menção a 'ambos no G4', mas ${
            homeRank > 6 ? `${ctx.homeTeam} (${homeRank}º)` : ''
          } ${awayRank > 6 ? `${ctx.awayTeam} (${awayRank}º)` : ''} está fora do topo. Corrigindo frase.`,
        );
        sanitized = sanitized.replace(
          /(?:o\s+empate\s+mantém\s+)?(?:ambos|os dois|as duas equipes|os clubes).*?(?:briga|luta|disputa|busca|mira|almeja|sonha).*?(?:pelo|por|o|ao)\s+(?:g-?4|g4)/gi,
          (match) => {
            if (homeRank > 0 && awayRank > 0) {
              const topTeam = homeRank < awayRank ? ctx.homeTeam : ctx.awayTeam;
              const topRank = Math.min(homeRank, awayRank);
              const midTeam = homeRank < awayRank ? ctx.awayTeam : ctx.homeTeam;
              const midRank = Math.max(homeRank, awayRank);
              return `o resultado reflete momentos distintos na tabela, com o ${topTeam} (${topRank}º) no pelotão de frente e o ${midTeam} (${midRank}º) na zona intermediária`;
            }
            return `as duas equipes buscando seus objetivos na competição`;
          },
        );
      }

      // Menção específica ao clube que está fora do top 6 buscando G4
      if (homeRank > 6) {
        const homePattern = new RegExp(
          `(${ctx.homeTeam}|time da casa|mandante|equipe da casa).*?(?:busca|mira|almeja|sonha|briga|luta|disputa|quer|olho|tentando).*?(?:ao|o|no|pelo|por|com)?\\s*g-?4`,
          'i',
        );
        if (homePattern.test(sanitized)) {
          warnings.push(`Alucinação de G4: ${ctx.homeTeam} está em ${homeRank}º e não disputa G4.`);
          sanitized = sanitized.replace(
            homePattern,
            `${ctx.homeTeam} buscando estabilidade e recuperação na tabela`,
          );
        }
      }
      if (awayRank > 6) {
        const awayPattern = new RegExp(
          `(${ctx.awayTeam}|time visitante|visitante|equipe visitante).*?(?:busca|mira|almeja|sonha|briga|luta|disputa|quer|olho|tentando).*?(?:ao|o|no|pelo|por|com)?\\s*g-?4`,
          'i',
        );
        if (awayPattern.test(sanitized)) {
          warnings.push(`Alucinação de G4: ${ctx.awayTeam} está em ${awayRank}º e não disputa G4.`);
          sanitized = sanitized.replace(
            awayPattern,
            `${ctx.awayTeam} buscando estabilidade e recuperação na tabela`,
          );
        }
      }
    }

    // Regra Título: Time fora do top 3 não pode ser citado como disputando o título diretamente
    if (homeRank > 4 && new RegExp(`${ctx.homeTeam}.*disputa.*título`, 'i').test(sanitized)) {
      warnings.push(`Alucinação de título: ${ctx.homeTeam} está em ${homeRank}º e não disputa título diretamente.`);
      sanitized = sanitized.replace(new RegExp(`disputa o título`, 'gi'), 'busca subir na tabela');
    }
    if (awayRank > 4 && new RegExp(`${ctx.awayTeam}.*disputa.*título`, 'i').test(sanitized)) {
      warnings.push(`Alucinação de título: ${ctx.awayTeam} está em ${awayRank}º e não disputa título diretamente.`);
      sanitized = sanitized.replace(new RegExp(`disputa o título`, 'gi'), 'busca subir na tabela');
    }

    // Regra Z4: Time fora dos 4 últimos não pode ser citado como "lutando contra o Z4"
    if (homeRank < 16 && new RegExp(`${ctx.homeTeam}.*(no|contra o)\\s+z-?4`, 'i').test(sanitized)) {
      warnings.push(`Alucinação de Z4: ${ctx.homeTeam} está em ${homeRank}º e não está na zona de rebaixamento.`);
      sanitized = sanitized.replace(new RegExp(`(no|contra o)\\s+z-?4`, 'gi'), 'na parte intermediária');
    }
    if (awayRank < 16 && new RegExp(`${ctx.awayTeam}.*(no|contra o)\\s+z-?4`, 'i').test(sanitized)) {
      warnings.push(`Alucinação de Z4: ${ctx.awayTeam} está em ${awayRank}º e não está na zona de rebaixamento.`);
      sanitized = sanitized.replace(new RegExp(`(no|contra o)\\s+z-?4`, 'gi'), 'na parte intermediária');
    }

    return {
      passed: warnings.length === 0,
      sanitizedText: sanitized,
      warnings,
    };
  }

  /**
   * Audita consistência entre o placar real e a narrativa
   */
  private auditScoreConsistency(
    title: string,
    comment: string,
    ctx: AuditContext,
  ): { passed: boolean; sanitizedTitle: string; sanitizedComment: string; warnings: string[] } {
    const warnings: string[] = [];
    let sTitle = title;
    let sComment = comment;

    const isDraw = ctx.homeScore === ctx.awayScore;
    const isZeroZero = ctx.homeScore === 0 && ctx.awayScore === 0;

    // Se o jogo está 0 a 0, não pode dizer "vitória" ou "derrota"
    if (isZeroZero) {
      if (/vitória|venceu|derrota/i.test(sTitle)) {
        warnings.push('Título citou vitória/derrota com placar em 0x0. Corrigido.');
        sTitle = `${ctx.homeTeam} e ${ctx.awayTeam} em Duelo Equilibrado e Sem Gols`;
      }
      if (/vitória de|saiu vitorioso|foi derrotado/i.test(sComment)) {
        warnings.push('Comentário citou vencedor com placar em 0x0. Sanitizado.');
        sComment = sComment.replace(/vitória de|saiu vitorioso/gi, 'empate sem gols entre as equipes');
      }
    }

    // Se está empatado com gols, não pode dizer "sem gols"
    if (isDraw && ctx.homeScore > 0) {
      if (/sem gols|0 a 0|0x0/i.test(sTitle)) {
        warnings.push(`Título citou 'sem gols' mas jogo está ${ctx.homeScore}x${ctx.awayScore}. Corrigido.`);
        sTitle = `Empate em ${ctx.homeScore} a ${ctx.awayScore} entre ${ctx.homeTeam} e ${ctx.awayTeam}`;
      }
      if (/sem gols|0 a 0|0x0/i.test(sComment)) {
        warnings.push(`Comentário citou 'sem gols' com placar de ${ctx.homeScore}x${ctx.awayScore}. Corrigido.`);
        sComment = sComment.replace(/sem gols|0 a 0|0x0/gi, `empate com gols em ${ctx.homeScore} a ${ctx.awayScore}`);
      }
    }

    return {
      passed: warnings.length === 0,
      sanitizedTitle: sTitle,
      sanitizedComment: sComment,
      warnings,
    };
  }

  /**
   * Audita repetição de títulos e uso de clichês jornalísticos vazios
   */
  private auditTitleRepetition(
    title: string,
    ctx: AuditContext,
  ): { passed: boolean; sanitizedTitle: string; warnings: string[] } {
    const warnings: string[] = [];
    let sTitle = title.trim();
    const previous = (ctx.previousTitles || []).map((t) => t.trim().toLowerCase());

    const isDuplicate = previous.includes(sTitle.toLowerCase());
    const isGenericCliche =
      /^(Expectativa (de um duelo|alta|para)|Empate sem (emoção|gols)|Confronto tático de gigantes|Duelo tático equilibrado|Partida equilibrada)/i.test(
        sTitle,
      );

    if (isDuplicate || isGenericCliche) {
      warnings.push(
        `Título clichê ou duplicado detectado: "${sTitle}". Gerando manchete tática exclusiva.`,
      );

      if (ctx.homeScore !== ctx.awayScore) {
        const leader = ctx.homeScore > ctx.awayScore ? ctx.homeTeam : ctx.awayTeam;
        const trailer = ctx.homeScore > ctx.awayScore ? ctx.awayTeam : ctx.homeTeam;
        sTitle = `${leader} supera ${trailer} em duelo tático no placar de ${Math.max(ctx.homeScore, ctx.awayScore)}x${Math.min(ctx.homeScore, ctx.awayScore)}`;
      } else if (ctx.homeScore > 0) {
        sTitle = `${ctx.homeTeam} e ${ctx.awayTeam} empatam em ${ctx.homeScore} a ${ctx.awayScore} em embate disputado`;
      } else {
        sTitle = `${ctx.homeTeam} e ${ctx.awayTeam}: Escalações e Desenho Tático em Campo`;
      }
    }

    return {
      passed: warnings.length === 0,
      sanitizedTitle: sTitle,
      warnings,
    };
  }
}
