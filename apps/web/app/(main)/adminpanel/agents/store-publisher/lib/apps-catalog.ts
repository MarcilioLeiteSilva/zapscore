export interface EcosystemApp {
  id: string;
  name: string;
  shortName: string;
  leagueName: string;
  packageName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  region: 'Nacional' | 'Nordeste' | 'Sudeste' | 'Sul' | 'Internacional';
  stateCode?: string;
  defaultKeywords: string[];
  features: string[];
  privacyPolicyUrl: string;
  supportEmail: string;
  bundleVersion: string;
  bundleCode: number;
}

export const ECOSYSTEM_APPS: EcosystemApp[] = [
  {
    id: 'brasileirao',
    name: 'Brasileirão ZapScore',
    shortName: 'Brasileirão',
    leagueName: 'Brasileirão Série A e Série B',
    packageName: 'com.zapscore.brasileirao',
    primaryColor: '#10B981', // Verde esmeralda
    secondaryColor: '#047857',
    accentColor: '#F59E0B',
    region: 'Nacional',
    defaultKeywords: [
      'futebol brasileiro',
      'brasileirão série a',
      'tabela brasileirao',
      'jogos ao vivo',
      'placar ao vivo',
      'cartola',
      'notificações gol',
      'escalações futebol'
    ],
    features: [
      'Placar ao vivo instantâneo com push notification em tempo real',
      'Tabela atualizada da Série A e Série B com simulação G4 e Z4',
      'Notificações de escalações oficiais 50 minutos antes da bola rolar',
      'Comentários táticos ao vivo minuto a minuto gerados com IA',
      'Artilharia consolidada, vídeos dos melhores momentos e notícias diárias'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'pernambucano',
    name: 'Pernambucano ZapScore',
    shortName: 'Pernambucano',
    leagueName: 'Campeonato Pernambucano',
    packageName: 'com.zapscore.pernambucano',
    primaryColor: '#DC2626', // Vermelho frevo/coral/leão/náutico
    secondaryColor: '#991B1B',
    accentColor: '#FBBF24',
    region: 'Nordeste',
    stateCode: 'PE',
    defaultKeywords: [
      'campeonato pernambucano',
      'sport recife',
      'santa cruz',
      'nautico',
      'futebol pernambuco',
      'placar ao vivo',
      'tabela pernambucano'
    ],
    features: [
      'Cobertura completa do Sport, Santa Cruz, Náutico e interior',
      'Placar ao vivo com notificações push instantâneas',
      'Classificação completa, chaveamento do mata-mata e quadrangular do rebaixamento',
      'Escalações oficiais antecipadas e cobertura minuto a minuto',
      'Artilharia atualizada e vídeos oficiais dos gols'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'paraibano',
    name: 'Paraibano ZapScore',
    shortName: 'Paraibano',
    leagueName: 'Campeonato Paraibano',
    packageName: 'com.zapscore.paraibano',
    primaryColor: '#059669', // Verde Botafogo-PB / Treze / Campinense
    secondaryColor: '#064E3B',
    accentColor: '#EF4444',
    region: 'Nordeste',
    stateCode: 'PB',
    defaultKeywords: [
      'campeonato paraibano',
      'botafogo pb',
      'campinense',
      'treze pb',
      'sousa ec',
      'futebol paraiba',
      'placar ao vivo'
    ],
    features: [
      'Cobertura exclusiva do Botafogo-PB, Treze, Campinense e Sousa',
      'Gols e lances em tempo real com notificações push de alta velocidade',
      'Tabela de classificação atualizada a cada apito',
      'Escalações confirmadas, estatísticas e artilharia oficial',
      'Vídeos dos melhores momentos e notícias do futebol da Paraíba'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'maranhense',
    name: 'Maranhense ZapScore',
    shortName: 'Maranhense',
    leagueName: 'Campeonato Maranhense',
    packageName: 'com.zapscore.maranhense',
    primaryColor: '#2563EB', // Azul Sampaio Corrêa / Moto Club / Maranhão AC
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    region: 'Nordeste',
    stateCode: 'MA',
    defaultKeywords: [
      'campeonato maranhense',
      'sampaio correa',
      'moto club',
      'maranhao ac',
      'futebol maranhao',
      'placar ao vivo',
      'tabela maranhense'
    ],
    features: [
      'Acompanhe o Sampaio Corrêa, Moto Club, Maranhão AC e Cordino',
      'Alertas de gol e início de partida instantâneos',
      'Tabela oficial, artilharia e chaveamento do estadual',
      'Escalações antes da bola rolar e dados de cada partida',
      'Notícias apuradas em tempo real com fotos em alta definição'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'alagoano',
    name: 'Alagoano ZapScore',
    shortName: 'Alagoano',
    leagueName: 'Campeonato Alagoano',
    packageName: 'com.zapscore.estadualalagoano',
    primaryColor: '#E11D48',
    secondaryColor: '#9F1239',
    accentColor: '#3B82F6',
    region: 'Nordeste',
    stateCode: 'AL',
    defaultKeywords: [
      'campeonato alagoano',
      'crb',
      'csa',
      'asa de arapiraca',
      'futebol alagoas',
      'placar alagoano',
      'tabela alagoano'
    ],
    features: [
      'Clássicos das Multidões no Estádio Rei Pelé acompanhados lance a lance',
      'Push notification de gols no exato momento da bola na rede',
      'Tabela de classificação atualizada, artilharia e chaveamento',
      'Escalações confirmadas e estatísticas detalhadas de posse e finalizações',
      'Vídeos dos gols e notícias diárias do futebol alagoano'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'paulista',
    name: 'Paulista ZapScore',
    shortName: 'Paulistão',
    leagueName: 'Campeonato Paulista Série A1',
    packageName: 'com.zapscore.paulista',
    primaryColor: '#E11D48', // Vermelho vibrante Paulistão Sicredi
    secondaryColor: '#9F1239',
    accentColor: '#FBBF24',
    region: 'Sudeste',
    stateCode: 'SP',
    defaultKeywords: [
      'paulistao',
      'campeonato paulista',
      'corinthians',
      'palmeiras',
      'sao paulo fc',
      'santos',
      'futebol sp',
      'placar ao vivo'
    ],
    features: [
      'Cobertura dos 4 grandes de SP e de todos os clubes do interior',
      'Notificações instantâneas de gols, cartões e VAR',
      'Tabela de grupos atualizada em tempo real com cruzamento de quartas',
      'Escalações oficiais até 1h antes dos clássicos',
      'Artilharia e melhores momentos em vídeo'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'carioca',
    name: 'Carioca ZapScore',
    shortName: 'Cariocão',
    leagueName: 'Campeonato Carioca',
    packageName: 'com.zapscore.carioca',
    primaryColor: '#0284C7', // Azul do Rio / Maracanã
    secondaryColor: '#0369A1',
    accentColor: '#F97316',
    region: 'Sudeste',
    stateCode: 'RJ',
    defaultKeywords: [
      'cariocao',
      'campeonato carioca',
      'flamengo',
      'vasco',
      'fluminense',
      'botafogo',
      'taca guanabara',
      'placar ao vivo rio'
    ],
    features: [
      'Taça Guanabara e Taça Rio com cobertura do clássicos no Maracanã',
      'Placar ao vivo super veloz com push notifications dos 4 grandes',
      'Classificação atualizada, saldo de gols e chaveamento semifinal',
      'Comentários táticos ao vivo e escalações oficiais',
      'Melhores momentos em vídeo e notícias apuradas'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'mineiro',
    name: 'Mineiro ZapScore',
    shortName: 'Mineiro',
    leagueName: 'Campeonato Mineiro',
    packageName: 'com.zapscore.mineiro',
    primaryColor: '#D97706', // Ouro de Minas
    secondaryColor: '#B45309',
    accentColor: '#10B981',
    region: 'Sudeste',
    stateCode: 'MG',
    defaultKeywords: [
      'campeonato mineiro',
      'atletico mg',
      'cruzeiro',
      'america mg',
      'futebol minas',
      'placar mineirao',
      'tabela mineiro'
    ],
    features: [
      'Clássicos no Mineirão e Arena MRV acompanhados lance a lance',
      'Push notification de gols no exato momento da bola na rede',
      'Tabela de classificação por grupos e ranking geral',
      'Escalações confirmadas e estatísticas detalhadas de posse e finalizações',
      'Vídeos dos gols e notícias diárias do futebol mineiro'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'gaucho',
    name: 'Gaúcho ZapScore',
    shortName: 'Gauchão',
    leagueName: 'Campeonato Gaúcho',
    packageName: 'com.zapscore.gaucho',
    primaryColor: '#0D9488', // Verde / Azul Rio Grande
    secondaryColor: '#115E59',
    accentColor: '#E11D48',
    region: 'Sul',
    stateCode: 'RS',
    defaultKeywords: [
      'gauchao',
      'campeonato gaucho',
      'gremio',
      'internacional',
      'grenal',
      'juventude',
      'caxias',
      'futebol rs'
    ],
    features: [
      'Especial Grenal e todos os jogos de Grêmio, Inter e times do interior gaúcho',
      'Alertas sonoros e silenciosos de gols em tempo real',
      'Tabela do Gauchão atualizada com saldo e cartões',
      'Escalações titulares e reservas antes da partida',
      'Resumos das rodadas e notícias atualizadas'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'baiano',
    name: 'Baiano ZapScore',
    shortName: 'Baianão',
    leagueName: 'Campeonato Baiano',
    packageName: 'com.zapscore.baiano',
    primaryColor: '#059669', // Cores da Bahia
    secondaryColor: '#047857',
    accentColor: '#EF4444',
    region: 'Nordeste',
    stateCode: 'BA',
    defaultKeywords: [
      'campeonato baiano',
      'baianao',
      'bahia',
      'vitoria',
      'bavi',
      'futebol bahia',
      'placar ao vivo ba'
    ],
    features: [
      'Tudo sobre o Ba-Vi, Bahia, Vitória e interior da Bahia',
      'Notificação de gols sem atraso no seu celular',
      'Tabela com classificação ao vivo do G4 e Z2',
      'Escalações oficiais e análises de cada confronto',
      'Vídeos dos gols e galeria de notícias esportivas'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'cearense',
    name: 'Cearense ZapScore',
    shortName: 'Cearense',
    leagueName: 'Campeonato Cearense',
    packageName: 'com.zapscore.cearense',
    primaryColor: '#3B82F6', // Azul Ceará / Fortaleza
    secondaryColor: '#1D4ED8',
    accentColor: '#EF4444',
    region: 'Nordeste',
    stateCode: 'CE',
    defaultKeywords: [
      'campeonato cearense',
      'fortaleza ec',
      'ceara sc',
      'clasico rei',
      'ferroviario',
      'futebol ceara',
      'placar castelao'
    ],
    features: [
      'Acompanhe o Clássico-Rei, Fortaleza, Ceará e Ferroviário',
      'Push de gols com alerta imediato',
      'Tabela de fases e quadrangular do rebaixamento',
      'Escalações confirmadas e mapa de artilheiros',
      'Vídeos e reportagens exclusivas do futebol do Ceará'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'copadonordeste',
    name: 'Copa do Nordeste ZapScore',
    shortName: 'Lampions League',
    leagueName: 'Copa do Nordeste',
    packageName: 'com.zapscore.copadonordeste',
    primaryColor: '#F59E0B', // Dourado Lampions
    secondaryColor: '#B45309',
    accentColor: '#10B981',
    region: 'Nordeste',
    defaultKeywords: [
      'copa do nordeste',
      'lampions league',
      'futebol nordeste',
      'fase de grupos nordeste',
      'placar ao vivo',
      'mata mata nordeste'
    ],
    features: [
      'A maior competição regional do Brasil na tela do seu celular',
      'Notificações instantâneas de gols e partidas decisivas',
      'Classificação dos Grupos A e B com cruzamentos do mata-mata',
      'Escalações oficiais até 1h antes dos jogos',
      'Artilharia regional e vídeos com todos os gols da rodada'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'copadobrasil',
    name: 'Copa do Brasil ZapScore',
    shortName: 'Copa do Brasil',
    leagueName: 'Copa do Brasil',
    packageName: 'com.zapscore.copadobrasil',
    primaryColor: '#10B981', // Verde taça
    secondaryColor: '#047857',
    accentColor: '#3B82F6',
    region: 'Nacional',
    defaultKeywords: [
      'copa do brasil',
      'mata mata futebol',
      'chaveamento copa do brasil',
      'disputa de penaltis',
      'placar ao vivo brasil'
    ],
    features: [
      'Toda a emoção do mata-mata mais democrático do país',
      'Alertas de gol e decisões por pênaltis em tempo real',
      'Chaveamento dinâmico desde a primeira fase até a final',
      'Escalações confirmadas e retrospecto frente a frente (H2H)',
      'Vídeos dos gols e transmissões lance a lance'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'champions',
    name: 'Champions League ZapScore',
    shortName: 'Champions',
    leagueName: 'UEFA Champions League',
    packageName: 'com.zapscore.champions',
    primaryColor: '#1E3A8A', // Azul escuro UEFA
    secondaryColor: '#172554',
    accentColor: '#38BDF8',
    region: 'Internacional',
    defaultKeywords: [
      'champions league',
      'uefa champions',
      'liga dos campeoes',
      'real madrid',
      'barcelona',
      'manchester city',
      'futebol europeu',
      'placar champions'
    ],
    features: [
      'Novo formato de fase de liga da UEFA Champions League',
      'Push notification em milissegundos para gols e cartões',
      'Tabela de 36 clubes atualizada em tempo real',
      'Escalações oficiais da UEFA 60 minutos antes do apito inicial',
      'Vídeos de melhores momentos e estatísticas avançadas de jogadores'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'libertadores',
    name: 'Libertadores ZapScore',
    shortName: 'Libertadores',
    leagueName: 'CONMEBOL Libertadores',
    packageName: 'com.zapscore.libertadores',
    primaryColor: '#D97706', // Dourado da Glória Eterna
    secondaryColor: '#78350F',
    accentColor: '#F59E0B',
    region: 'Internacional',
    defaultKeywords: [
      'copa libertadores',
      'conmebol libertadores',
      'gloria eterna',
      'fase de grupos libertadores',
      'mata mata libertadores',
      'placar ao vivo conmebol'
    ],
    features: [
      'Viva a Glória Eterna com cobertura completa dos clubes brasileiros e sul-americanos',
      'Alertas de gols, expulsões e resultados parciais',
      'Tabela de classificação e chaveamento do sorteio das oitavas',
      'Escalações oficiais antecipadas e estatísticas da partida',
      'Vídeos dos gols e destaques em alta resolução'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'premierleague',
    name: 'Premier League ZapScore',
    shortName: 'Premier League',
    leagueName: 'Premier League (Inglaterra)',
    packageName: 'com.zapscore.premierleague',
    primaryColor: '#6D28D9', // Roxo Premier
    secondaryColor: '#4C1D95',
    accentColor: '#00FF87',
    region: 'Internacional',
    defaultKeywords: [
      'premier league',
      'campeonato ingles',
      'arsenal',
      'liverpool',
      'manchester city',
      'chelsea',
      'tabela premier league',
      'placar ao vivo ingles'
    ],
    features: [
      'A liga mais disputada do mundo com cobertura segundo a segundo',
      'Notificações instantâneas de gols, substituições e prorrogações',
      'Tabela da Premier League com classificação para Champions e rebaixamento',
      'Escalações oficiais divulgadas 1h antes com banco completo',
      'Artilharia da Premier League e vídeos oficiais'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'laliga',
    name: 'La Liga ZapScore',
    shortName: 'La Liga',
    leagueName: 'La Liga EA Sports (Espanha)',
    packageName: 'com.zapscore.laliga',
    primaryColor: '#DC2626', // Vermelho La Liga
    secondaryColor: '#991B1B',
    accentColor: '#FBBF24',
    region: 'Internacional',
    defaultKeywords: [
      'la liga',
      'campeonato espanhol',
      'real madrid',
      'barcelona',
      'atletico de madrid',
      'el clasico',
      'tabela la liga'
    ],
    features: [
      'El Clásico e todos os jogos da Espanha em tempo real',
      'Push notification de gols com mínima latência',
      'Tabela de classificação com zona de Champions e Europa League',
      'Escalações confirmadas e mapa tático das equipes',
      'Artilharia do Troféu Pichichi e vídeos dos melhores momentos'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'seriea',
    name: 'Serie A Itália ZapScore',
    shortName: 'Serie A Itália',
    leagueName: 'Serie A Made in Italy (Itália)',
    packageName: 'com.zapscore.seriea',
    primaryColor: '#0284C7', // Azul Serie A
    secondaryColor: '#0369A1',
    accentColor: '#10B981',
    region: 'Internacional',
    defaultKeywords: [
      'serie a italia',
      'campeonato italiano',
      'inter de milao',
      'milan',
      'juventus',
      'napoli',
      'tabela serie a italia',
      'calcio ao vivo'
    ],
    features: [
      'O melhor do futebol italiano: Inter, Milan, Juventus, Roma e Napoli',
      'Gols e resultados ao vivo com notificações sonoras e push',
      'Tabela de classificação atualizada da Serie A',
      'Escalações oficiais e estatísticas dos confrontos',
      'Ranking de artilheiros e notícias apuradas da rodada'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga ZapScore',
    shortName: 'Bundesliga',
    leagueName: 'Bundesliga (Alemanha)',
    packageName: 'com.zapscore.bundesliga',
    primaryColor: '#D97706', // Dourado Bundesliga
    secondaryColor: '#92400E',
    accentColor: '#EF4444',
    region: 'Internacional',
    defaultKeywords: [
      'bundesliga',
      'campeonato alemao',
      'bayern de munique',
      'borussia dortmund',
      'bayer leverkusen',
      'tabela bundesliga',
      'futebol alemao ao vivo'
    ],
    features: [
      'Gols e intensidade do futebol alemão com notificações em tempo real',
      'Tabela da Bundesliga com vagas europeias e playoff de rebaixamento',
      'Escalações confirmadas com histórico recente das equipes',
      'Ranking de artilheiros (Canhão da Bundesliga)',
      'Vídeos dos gols e estatísticas completas de finalização e posse'
    ],
    privacyPolicyUrl: 'https://zapscore.com.br/politica-de-privacidade',
    supportEmail: 'suporte@zapscore.com.br',
    bundleVersion: '1.0.0',
    bundleCode: 1
  }
];

export function getAppById(id: string): EcosystemApp | undefined {
  return ECOSYSTEM_APPS.find((app) => app.id === id);
}

export function getAppsByRegion(region: EcosystemApp['region']): EcosystemApp[] {
  return ECOSYSTEM_APPS.filter((app) => app.region === region);
}
