import { Injectable, Logger } from '@nestjs/common';
import * as zlib from 'zlib';

export interface ParsedSumulaPlayer {
  number: number;
  name: string;
  nickname: string;
  isStarter: boolean;
}

export interface ParsedSumulaGoal {
  minute: string;
  half: string;
  shirtNumber: number;
  playerName: string;
  teamName: string;
}

export interface ParsedSumulaResult {
  homeTeam: {
    name: string;
    starters: ParsedSumulaPlayer[];
    substitutes: ParsedSumulaPlayer[];
  };
  awayTeam: {
    name: string;
    starters: ParsedSumulaPlayer[];
    substitutes: ParsedSumulaPlayer[];
  };
  goals: ParsedSumulaGoal[];
}

@Injectable()
export class SumulaParserService {
  private readonly logger = new Logger(SumulaParserService.name);

  /**
   * Baixa a súmula em PDF direto da CBF/Federação e decodifica as tabelas de titulares, suplentes e gols
   */
  async parseFromUrl(url: string): Promise<ParsedSumulaResult | null> {
    try {
      this.logger.log(`[SumulaParser] Baixando súmula oficial de ${url}...`);
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!res.ok) {
        this.logger.warn(`[SumulaParser] HTTP ${res.status} ao baixar súmula de ${url}`);
        return null;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      return this.parseBuffer(buffer);
    } catch (err: any) {
      this.logger.error(`[SumulaParser] Falha ao processar súmula de ${url}: ${err.message}`);
      return null;
    }
  }

  /**
   * Decodifica os streams comprimidos do PDF via zlib e faz o parsing estruturado
   */
  parseBuffer(buffer: Buffer): ParsedSumulaResult | null {
    const allTextElements: string[] = [];
    let offset = 0;

    while ((offset = buffer.indexOf('stream', offset)) !== -1) {
      let start = offset + 6;
      if (buffer[start] === 0x0d && buffer[start + 1] === 0x0a) start += 2;
      else if (buffer[start] === 0x0a) start += 1;

      const end = buffer.indexOf('endstream', start);
      if (end === -1) break;

      const streamData = buffer.slice(start, end);
      try {
        const text = zlib.inflateSync(streamData).toString('latin1');
        const tjMatches = [...text.matchAll(/\(([^)]+)\)\s*Tj/g)].map((m) => m[1]);
        allTextElements.push(...tjMatches);
      } catch {
        // Stream não comprimido ou não flate
      }
      offset = end + 9;
    }

    if (allTextElements.length === 0) {
      return null;
    }

    const result: ParsedSumulaResult = {
      homeTeam: { name: '', starters: [], substitutes: [] },
      awayTeam: { name: '', starters: [], substitutes: [] },
      goals: [],
    };

    // 1. Extração da Relação de Jogadores (Titulares e Suplentes)
    const relacaoIdx = allTextElements.findIndex(
      (el) =>
        el.trim().toLowerCase().includes('relação de jogadores') ||
        el.trim().toLowerCase().includes('relacao de jogadores'),
    );

    if (relacaoIdx !== -1) {
      // Nome do Mandante
      result.homeTeam.name = (allTextElements[relacaoIdx + 1] || '').trim();

      let i = relacaoIdx + 8; // Pula os cabeçalhos da tabela do mandante
      let currentTeam = result.homeTeam;

      while (i < allTextElements.length) {
        const val = (allTextElements[i] || '').trim();

        // Identifica o início da equipe visitante
        if (
          val &&
          (val.includes('/ PE') ||
            val.includes('/PE') ||
            val.toLowerCase().includes('comissão técnica') ||
            val.toLowerCase().includes('comissao tecnica'))
        ) {
          if (val.toLowerCase().includes('comiss')) break;
          result.awayTeam.name = val;
          currentTeam = result.awayTeam;
          i += 7; // Pula o cabeçalho da tabela do visitante
          continue;
        }

        const num = parseInt(val, 10);
        if (!isNaN(num) && num > 0 && num <= 99) {
          const apelido = (allTextElements[i + 1] || '').trim();
          const nomeCompleto = (allTextElements[i + 2] || apelido).trim().replace(/\s*\.\.\.$/, '');

          // Em súmulas CBF/FPF os primeiros 11 atletas listados de cada equipe são sempre os titulares
          const isStarter = currentTeam.starters.length < 11;

          const player: ParsedSumulaPlayer = {
            number: num,
            nickname: apelido,
            name: nomeCompleto,
            isStarter,
          };

          if (isStarter) {
            currentTeam.starters.push(player);
          } else {
            currentTeam.substitutes.push(player);
          }
          i += 6;
        } else {
          i++;
        }
      }
    }

    // 2. Extração dos Gols Oficiais da Partida
    const golsIdx = allTextElements.findIndex((el) => el.trim().toLowerCase() === 'gols');
    if (golsIdx !== -1) {
      let i = golsIdx + 7;
      while (i < allTextElements.length && !allTextElements[i].toLowerCase().includes('cart')) {
        const tempo = (allTextElements[i] || '').trim();
        const tempoHalf = (allTextElements[i + 1] || '').trim();
        const num = (allTextElements[i + 2] || '').trim();
        const nome = (allTextElements[i + 4] || '').trim();
        const equipe = (allTextElements[i + 5] || '').trim();

        const numParsed = parseInt(num, 10);
        if (tempo && !isNaN(numParsed) && nome) {
          result.goals.push({
            minute: tempo,
            half: tempoHalf,
            shirtNumber: numParsed,
            playerName: nome,
            teamName: equipe,
          });
          i += 6;
        } else {
          break;
        }
      }
    }

    return result;
  }
}
