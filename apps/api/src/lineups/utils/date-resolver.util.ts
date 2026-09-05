export interface ResolvedMatchDates {
  brt: {
    iso: string;        // "YYYY-MM-DD"
    formatted: string;  // "DD/MM/YYYY"
    compact: string;    // "YYYYMMDD"
  };
  utc: {
    iso: string;        // "YYYY-MM-DD"
    formatted: string;  // "DD/MM/YYYY"
    compact: string;    // "YYYYMMDD"
  };
  allDatesFormatted: string[]; // ["DD/MM/YYYY", ...] deduplicadas
  allDatesCompact: string[];   // ["YYYYMMDD", ...] deduplicadas
  allDatesIso: string[];       // ["YYYY-MM-DD", ...] deduplicadas
}

/**
 * Utilitário Canônico Universal para Resolução de Datas em Jogos Nacionais e Internacionais.
 * Garante que qualquer partida (seja às 15h, 21h, 23h ou madrugada) seja localizada com 100% de
 * precisão tanto em fontes que agrupam por horário de Brasília (UOL, 365Scores) quanto por UTC (LiveScore, ESPN).
 */
export function resolveMatchDates(dateInput: Date | string): ResolvedMatchDates {
  const d = new Date(dateInput);

  // 1. Fuso de Brasília (BRT / UTC-3)
  const brtIso = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // "YYYY-MM-DD"
  const [brtY, brtM, brtD] = brtIso.split('-');
  const brtFormatted = `${brtD}/${brtM}/${brtY}`;
  const brtCompact = `${brtY}${brtM}${brtD}`;

  // 2. Fuso UTC Internacional
  const utcY = d.getUTCFullYear().toString();
  const utcM = String(d.getUTCMonth() + 1).padStart(2, '0');
  const utcD = String(d.getUTCDate()).padStart(2, '0');
  const utcIso = `${utcY}-${utcM}-${utcD}`;
  const utcFormatted = `${utcD}/${utcM}/${utcY}`;
  const utcCompact = `${utcY}${utcM}${utcD}`;

  return {
    brt: {
      iso: brtIso,
      formatted: brtFormatted,
      compact: brtCompact,
    },
    utc: {
      iso: utcIso,
      formatted: utcFormatted,
      compact: utcCompact,
    },
    allDatesFormatted: Array.from(new Set([brtFormatted, utcFormatted])),
    allDatesCompact: Array.from(new Set([brtCompact, utcCompact])),
    allDatesIso: Array.from(new Set([brtIso, utcIso])),
  };
}
