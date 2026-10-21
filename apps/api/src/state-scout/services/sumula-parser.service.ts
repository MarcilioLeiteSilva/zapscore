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

    const comissaoIdx = allTextElements.findIndex(
      (el, i) => i > relacaoIdx && el.toLowerCase().includes('comissão técnica'),
    );

    const awayTeamIdx = allTextElements.findIndex(
      (el, i) =>
        i > relacaoIdx + 5 &&
        (comissaoIdx === -1 || i < comissaoIdx) &&
        (/\s*\/\s*[A-Z]{2}\b/.test(el) || el.includes('/ PE') || el.includes('/PE')),
    );

    const parseTeamPlayers = (startIdx: number, endIdx: number): ParsedSumulaPlayer[] => {
      const players: ParsedSumulaPlayer[] = [];
      let i = startIdx;
      while (i < endIdx) {
        const val = (allTextElements[i] || '').trim();
        const num = parseInt(val, 10);
        if (!isNaN(num) && num > 0 && num <= 99 && val.length <= 2) {
          let name = '';
          let nickname = '';
          let j = i + 1;
          while (j < endIdx) {
            const nextVal = (allTextElements[j] || '').trim();
            const nextNum = parseInt(nextVal, 10);
            if (!isNaN(nextNum) && nextNum > 0 && nextNum <= 99 && nextVal.length <= 2) {
              break;
            }
            if (
              nextVal === 'T' ||
              nextVal === 'R' ||
              nextVal === 'P' ||
              nextVal === 'A' ||
              nextVal === 'Nº' ||
              nextVal === 'Apelido' ||
              nextVal === 'Nome Completo' ||
              nextVal === 'T/R' ||
              nextVal === 'P/A' ||
              nextVal === 'CBF' ||
              /^\d{5,7}$/.test(nextVal)
            ) {
              // Metadata token
            } else if (/[a-zA-ZÀ-ÿ]/.test(nextVal)) {
              if (!name) {
                name = nextVal.replace(/\s*\.\.\.$/, '');
              } else if (!nickname) {
                nickname = name;
                name = nextVal.replace(/\s*\.\.\.$/, '');
              }
            }
            j++;
          }
          const isStarter = players.length < 11;
          players.push({
            number: num,
            name: name || `Jogador #${num}`,
            nickname: nickname || name,
            isStarter,
          });
          i = j;
        } else {
          i++;
        }
      }
      return players;
    };

    if (relacaoIdx !== -1 && awayTeamIdx !== -1) {
      result.homeTeam.name = (allTextElements[relacaoIdx + 1] || '').trim();
      result.awayTeam.name = (allTextElements[awayTeamIdx] || '').trim();

      const homeEnd = awayTeamIdx;
      const awayEnd = comissaoIdx !== -1 ? comissaoIdx : allTextElements.length;

      const homePlayers = parseTeamPlayers(relacaoIdx, homeEnd);
      const awayPlayers = parseTeamPlayers(awayTeamIdx, awayEnd);

      result.homeTeam.starters = homePlayers.filter((p) => p.isStarter);
      result.homeTeam.substitutes = homePlayers.filter((p) => !p.isStarter);

      result.awayTeam.starters = awayPlayers.filter((p) => p.isStarter);
      result.awayTeam.substitutes = awayPlayers.filter((p) => !p.isStarter);
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
