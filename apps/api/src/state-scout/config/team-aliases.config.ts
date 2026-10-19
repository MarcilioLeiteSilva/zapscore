export interface TeamAliasMapping {
  externalId: number;
  canonicalName: string;
  aliases: string[];
  siglas?: string[];
}

export function normalizeTeamString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')   // pontuações viram espaço
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Catálogo Canônico de Aliases, Variações de Nomes e Siglas por Competição
 * Permite pareamento 100% determinístico entre FPF, GE Globo, API-Football e fontes externas.
 */
export const STATE_LEAGUE_ALIASES: Record<number, TeamAliasMapping[]> = {
  // Campeonato Pernambucano (Liga 622)
  622: [
    {
      externalId: 22821,
      canonicalName: 'Jaguaré',
      aliases: [
        'jaguar',
        'jaguare',
        'ad jaguar',
        'associacao desportiva jaguar',
        'jaguar jaboatao',
        'jaguar de jaboatao',
        'jaguar pe',
      ],
      siglas: ['JAG'],
    },
    {
      externalId: 7853,
      canonicalName: 'Atlético PE',
      aliases: [
        'atletico pe',
        'atletico-pe',
        'atletico pernambucano',
        'clube atletico pernambucano',
        'atletico de pernambuco',
        'atletico',
      ],
      siglas: ['CAP', 'ATL', 'ATE'],
    },
    {
      externalId: 2210,
      canonicalName: 'Central SC',
      aliases: [
        'central de caruaru',
        'central',
        'central sc',
        'central sport club',
        'patativa',
        'central caruaru',
      ],
      siglas: ['CEN'],
    },
    {
      externalId: 28463,
      canonicalName: 'Facilnet',
      aliases: [
        'facilnet futebol clube',
        'facilnet fc',
        'facilnet',
        'facil net',
      ],
      siglas: ['FAC'],
    },
    {
      externalId: 25084,
      canonicalName: '1º de Maio',
      aliases: [
        '1 de maio',
        '1º de maio',
        'primeiro de maio',
        '1º de maio esporte clube',
        '1 de maio esporte clube',
      ],
      siglas: ['MAI', '1MA'],
    },
    {
      externalId: 7819,
      canonicalName: 'América PE',
      aliases: [
        'america',
        'america pe',
        'america-pe',
        'america futebol clube',
        'mequinha',
      ],
      siglas: ['AME'],
    },
    {
      externalId: 7857,
      canonicalName: 'Guarany de Sobral',
      aliases: [
        'guarany',
        'guarany camaragibe',
        'guarani',
        'guarany de sobral',
        'guarany pe',
        'guarany de camaragibe',
      ],
      siglas: ['GUA'],
    },
    {
      externalId: 25081,
      canonicalName: 'Aguia FC',
      aliases: [
        'aguia',
        'aguia fc',
        'aguia de cumaru',
        'aguia futebol clube',
        'aguia cumaru',
      ],
      siglas: ['AGU'],
    },
    {
      externalId: 28465,
      canonicalName: 'Santa Fe PE',
      aliases: [
        'santa fe',
        'santa fe pe',
        'santa fe futebol clube',
        'santa fe fc',
      ],
      siglas: ['SFE'],
    },
    {
      externalId: 28466,
      canonicalName: 'Serrano PE',
      aliases: [
        'serrano',
        'serrano pe',
        'serrano futebol clube',
        'serrano fc',
      ],
      siglas: ['SER'],
    },
    {
      externalId: 12289,
      canonicalName: 'Ypiranga PE',
      aliases: [
        'ypiranga',
        'ypiranga pe',
        'sociedade esportiva ypiranga futebol clube',
        'ypiranga de santa cruz',
      ],
      siglas: ['YPI'],
    },
    {
      externalId: 24120,
      canonicalName: 'Centro Limoeirense',
      aliases: [
        'centro limoeirense',
        'centro',
        'limoeirense',
        'centro esportivo limoeirense',
      ],
      siglas: ['CLI'],
    },
    {
      externalId: 24121,
      canonicalName: 'Ipojuca',
      aliases: [
        'ipojuca',
        'ipojuca ac',
        'ipojuca atletico clube',
      ],
      siglas: ['IPO'],
    },
    {
      externalId: 18319,
      canonicalName: 'Íbis',
      aliases: [
        'ibis',
        'ibis sport club',
        'passaro preto',
        'ibis sc',
      ],
      siglas: ['IBI'],
    },
    {
      externalId: 25082,
      canonicalName: 'Cha Grande',
      aliases: [
        'cha grande',
        'chã grande',
        'cha grande futebol clube',
        'cha grande fc',
      ],
      siglas: ['CHG'],
    },
    {
      externalId: 25083,
      canonicalName: 'Pesqueira',
      aliases: [
        'pesqueira',
        'pesqueira futebol clube',
        'pesqueira fc',
      ],
      siglas: ['PES'],
    },
    {
      externalId: 28464,
      canonicalName: 'Ferroviario do Cabo',
      aliases: [
        'ferroviario do cabo',
        'ferroviario',
        'ferroviario pe',
        'ferroviario cabo',
      ],
      siglas: ['FER', 'FCA'],
    },
    {
      externalId: 16446,
      canonicalName: 'Vera Cruz',
      aliases: [
        'vera cruz',
        'vera cruz futebol clube',
        'vera cruz fc',
      ],
      siglas: ['VCR'],
    },
    {
      externalId: 9129,
      canonicalName: 'Sete de Setembro',
      aliases: [
        'sete de setembro',
        'sete de setembro ec',
        'sete',
        'sete garanhuns',
      ],
      siglas: ['SET'],
    },
    {
      externalId: 7841,
      canonicalName: 'Belo Jardim',
      aliases: [
        'belo jardim',
        'belo jardim futebol clube',
        'calango',
        'belo jardim fc',
      ],
      siglas: ['BJD'],
    },
    {
      externalId: 20782,
      canonicalName: 'Porto',
      aliases: [
        'porto',
        'porto pe',
        'clube atletico do porto',
        'porto caruaru',
      ],
      siglas: ['POR'],
    },
    {
      externalId: 12299,
      canonicalName: 'Petrolina',
      aliases: [
        'petrolina',
        'petrolina sfc',
        'fera sertaneja',
        'petrolina social futebol clube',
      ],
      siglas: ['PET'],
    },
    {
      externalId: 9995,
      canonicalName: 'Afogados',
      aliases: [
        'afogados',
        'afogados da ingazeira',
        'coruja',
        'afogados fc',
      ],
      siglas: ['AFO'],
    },
    {
      externalId: 1205,
      canonicalName: 'Salgueiro',
      aliases: [
        'salgueiro',
        'salgueiro ac',
        'carcara',
        'salgueiro atletico clube',
      ],
      siglas: ['SAL'],
    },
    // Clubes da Elite (Turno Frevo)
    {
      externalId: 131,
      canonicalName: 'Sport Recife',
      aliases: ['sport', 'sport recife', 'sport club do recife', 'leao da ilha'],
      siglas: ['SPO', 'SCR'],
    },
    {
      externalId: 133,
      canonicalName: 'Náutico',
      aliases: ['nautico', 'clube nautico capibaribe', 'timbu'],
      siglas: ['NAU', 'CNC'],
    },
    {
      externalId: 134,
      canonicalName: 'Santa Cruz',
      aliases: ['santa cruz', 'santa cruz futebol clube', 'coral', 'tricolor do arruda'],
      siglas: ['STC', 'SAN'],
    },
    {
      externalId: 7856,
      canonicalName: 'Retrô',
      aliases: ['retro', 'retro futebol clube brasil', 'retro fc'],
      siglas: ['RET'],
    },
    {
      externalId: 17855,
      canonicalName: 'Maguary',
      aliases: ['maguary', 'associacao atletica maguary', 'azulao'],
      siglas: ['MAG'],
    },
    {
      externalId: 12287,
      canonicalName: 'Decisão',
      aliases: ['decisao', 'decisao sertania', 'sociedade atletica decisao', 'futebol clube decisao'],
      siglas: ['DEC'],
    },
    {
      externalId: 7858,
      canonicalName: 'Vitória PE',
      aliases: ['vitoria pe', 'vitoria das tabocas', 'associacao academica e desportiva vitoria das tabocas'],
      siglas: ['VIT'],
    },
    {
      externalId: 7847,
      canonicalName: 'Flamengo de Arcoverde',
      aliases: ['flamengo de arcoverde', 'flamengo pe', 'flamengo arcoverde'],
      siglas: ['FLA'],
    },
  ],
};

/**
 * Resolve o mapping canônico de um time a partir de qualquer string (FPF, GE, API, Sigla)
 */
export function resolveTeamAlias(rawName: string, leagueExternalId?: number): TeamAliasMapping | null {
  if (!rawName) return null;
  const norm = normalizeTeamString(rawName);
  if (!norm) return null;

  // Se especificada a liga, busca prioritariamente nos mappings daquela liga
  const list = leagueExternalId && STATE_LEAGUE_ALIASES[leagueExternalId]
    ? STATE_LEAGUE_ALIASES[leagueExternalId]
    : Object.values(STATE_LEAGUE_ALIASES).flat();

  // 1. Busca exata por nome canônico, aliases ou siglas
  for (const t of list) {
    if (normalizeTeamString(t.canonicalName) === norm) return t;
    if (t.aliases.some(a => normalizeTeamString(a) === norm)) return t;
    if (t.siglas && t.siglas.some(s => s.toLowerCase() === norm)) return t;
  }

  // 2. Busca por contenção de alias longo (>= 4 caracteres)
  for (const t of list) {
    if (t.aliases.some(a => {
      const aNorm = normalizeTeamString(a);
      return aNorm.length >= 4 && (norm.includes(aNorm) || aNorm.includes(norm));
    })) {
      return t;
    }
  }

  return null;
}
