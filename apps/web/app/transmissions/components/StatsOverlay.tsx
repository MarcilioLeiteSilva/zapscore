'use client';

import { useFixturePolling } from '../hooks/useFixturePolling';

const SPEED_MAP: Record<string, string> = {
  slow: '40s',
  normal: '25s',
  fast: '15s',
};

interface GroupedStat {
  type: string;
  homeValue: string;
  awayValue: string;
  homePercent: number;
  awayPercent: number;
}

function groupStats(stats: any[], homeTeamId: number, awayTeamId: number): GroupedStat[] {
  const map = new Map<string, { home: string; away: string }>();

  for (const stat of stats) {
    const existing = map.get(stat.type) || { home: '0', away: '0' };
    if (stat.teamId === homeTeamId) {
      existing.home = stat.value || '0';
    } else if (stat.teamId === awayTeamId) {
      existing.away = stat.value || '0';
    }
    map.set(stat.type, existing);
  }

  return Array.from(map.entries()).map(([type, vals]) => {
    const homeNum = parseFloat(vals.home.replace('%', '')) || 0;
    const awayNum = parseFloat(vals.away.replace('%', '')) || 0;
    const total = homeNum + awayNum || 1;
    return {
      type: translateStatType(type),
      homeValue: vals.home,
      awayValue: vals.away,
      homePercent: (homeNum / total) * 100,
      awayPercent: (awayNum / total) * 100,
    };
  });
}

function translateStatType(type: string): string {
  const translations: Record<string, string> = {
    'Ball Possession': 'Posse de Bola',
    'Shots on Goal': 'Finalizações no Gol',
    'Shots off Goal': 'Finalizações Fora',
    'Total Shots': 'Total de Finalizações',
    'Blocked Shots': 'Finalizações Bloqueadas',
    'Shots insidebox': 'Chutes Dentro da Área',
    'Shots outsidebox': 'Chutes Fora da Área',
    'Fouls': 'Faltas',
    'Corner Kicks': 'Escanteios',
    'Offsides': 'Impedimentos',
    'Yellow Cards': 'Cartões Amarelos',
    'Red Cards': 'Cartões Vermelhos',
    'Goalkeeper Saves': 'Defesas do Goleiro',
    'Total passes': 'Total de Passes',
    'Passes accurate': 'Passes Certos',
    'Passes %': 'Precisão de Passe',
    'expected_goals': 'Gols Esperados (xG)',
  };
  return translations[type] || type;
}

export default function StatsOverlay({
  leagueId,
  fixtureId,
  speed = 'normal',
}: {
  leagueId: number;
  fixtureId?: string;
  speed?: string;
}) {
  const { fixture, loading } = useFixturePolling(leagueId, fixtureId);
  const scrollDuration = SPEED_MAP[speed] || SPEED_MAP.normal;

  if (loading) {
    return (
      <div className="tx-loading">
        <div className="tx-loading-spinner" />
        <div className="tx-loading-text">CARREGANDO ESTATÍSTICAS...</div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="tx-empty">
        <div className="tx-empty-icon">📊</div>
        <div className="tx-empty-text">Nenhuma partida disponível</div>
      </div>
    );
  }

  const stats = fixture.stats || [];
  const grouped = groupStats(stats, fixture.homeTeam.externalId, fixture.awayTeam.externalId);

  if (grouped.length === 0) {
    return (
      <div className="tx-empty">
        <div className="tx-empty-icon">📊</div>
        <div className="tx-empty-text">Estatísticas ainda não disponíveis</div>
      </div>
    );
  }

  const StatBlock = () => (
    <>
      {grouped.map((stat, idx) => (
        <div key={idx} className="tx-stat-row">
          <div className="tx-stat-label">{stat.type}</div>
          <div className="tx-stat-values">
            <div className="tx-stat-value">{stat.homeValue}</div>
            <div className="tx-stat-bar-wrapper">
              <div
                className="tx-stat-bar tx-stat-bar-home"
                style={{ width: `${stat.homePercent}%` }}
              />
              <div
                className="tx-stat-bar tx-stat-bar-away"
                style={{ width: `${stat.awayPercent}%` }}
              />
            </div>
            <div className="tx-stat-value">{stat.awayValue}</div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="tx-viewport tx-fade-in">
      <div className="tx-stats tx-card">
        {/* Fixed Header */}
        <div className="tx-stats-header">
          <div className="tx-stats-team-info">
            <img src={fixture.homeTeam.logo} alt="" className="tx-stats-team-logo" />
            <span className="tx-stats-team-name">{fixture.homeTeam.name}</span>
          </div>
          <div className="tx-stats-title">ESTATÍSTICAS</div>
          <div className="tx-stats-team-info">
            <span className="tx-stats-team-name">{fixture.awayTeam.name}</span>
            <img src={fixture.awayTeam.logo} alt="" className="tx-stats-team-logo" />
          </div>
        </div>

        {/* Scroll mask edges */}
        <div className="tx-scroll-mask tx-scroll-mask-top" />
        <div className="tx-scroll-mask tx-scroll-mask-bottom" />

        {/* Scrolling Content (duplicated for seamless loop) */}
        <div className="tx-stats-scroll-container">
          <div
            className="tx-stats-scroll-content"
            style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
          >
            <StatBlock />
            {/* Duplicate for seamless loop */}
            <StatBlock />
          </div>
        </div>
      </div>
    </div>
  );
}
