'use client';

import { useStandingsPolling } from '../hooks/useFixturePolling';

const SPEED_MAP: Record<string, string> = {
  slow: '40s',
  normal: '25s',
  fast: '15s',
};

export default function StandingsOverlay({
  leagueId,
  season,
  competitionName,
  speed = 'normal',
}: {
  leagueId: number;
  season: number;
  competitionName: string;
  speed?: string;
}) {
  const { standings, loading } = useStandingsPolling(leagueId, season);
  const scrollDuration = SPEED_MAP[speed] || SPEED_MAP.normal;

  const getLogoUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  if (loading) {
    return (
      <div className="tx-loading">
        <div className="tx-loading-spinner" />
        <div className="tx-loading-text">CARREGANDO CLASSIFICAÇÃO...</div>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="tx-empty">
        <div className="tx-empty-icon">🏆</div>
        <div className="tx-empty-text">Classificação não disponível</div>
      </div>
    );
  }

  const getRankClass = (rank: number, total: number) => {
    if (rank <= 4) return 'tx-standings-rank-top';
    if (rank >= total - 3) return 'tx-standings-rank-bottom';
    return 'tx-standings-rank-mid';
  };

  const TableRows = () => (
    <>
      {standings.map((item: any) => (
        <div key={item.id} className="tx-standings-row">
          <div className={`tx-standings-rank ${getRankClass(item.rank, standings.length)}`}>
            {item.rank}
          </div>
          <div className="tx-standings-team-cell">
            <img src={getLogoUrl(item.team.logo)} alt="" className="tx-standings-team-logo" />
            <span className="tx-standings-team-name">{item.team.name}</span>
          </div>
          <div className="tx-standings-pts">{item.points}</div>
          <div className="tx-standings-cell">{item.played}</div>
          <div className="tx-standings-cell">{item.win}</div>
          <div className="tx-standings-cell">{item.draw}</div>
          <div className="tx-standings-cell">{item.lose}</div>
          <div className={`tx-standings-cell ${item.goalsDiff > 0 ? 'tx-standings-gd-positive' : item.goalsDiff < 0 ? 'tx-standings-gd-negative' : ''}`}>
            {item.goalsDiff > 0 ? `+${item.goalsDiff}` : item.goalsDiff}
          </div>
        </div>
      ))}
    </>
  );

  // Only use scroll loop if standings might overflow (more than ~12 rows)
  const needsScroll = standings.length > 12;

  return (
    <div className="tx-viewport tx-fade-in">
      <div className="tx-standings tx-card">
        {/* Fixed Header */}
        <div className="tx-standings-header">
          <div className="tx-standings-title">CLASSIFICAÇÃO</div>
          <div className="tx-standings-competition">{competitionName.toUpperCase()}</div>
        </div>

        {/* Table Column Headers */}
        <div className="tx-standings-table-header">
          <span style={{ textAlign: 'center' }}>#</span>
          <span>CLUBE</span>
          <span style={{ textAlign: 'center' }}>PTS</span>
          <span style={{ textAlign: 'center' }}>J</span>
          <span style={{ textAlign: 'center' }}>V</span>
          <span style={{ textAlign: 'center' }}>E</span>
          <span style={{ textAlign: 'center' }}>D</span>
          <span style={{ textAlign: 'center' }}>SG</span>
        </div>

        {needsScroll ? (
          <>
            {/* Gradient masks */}
            <div className="tx-scroll-mask tx-scroll-mask-top" style={{ top: '16vh' }} />
            <div className="tx-scroll-mask tx-scroll-mask-bottom" />

            {/* Scrolling Content */}
            <div className="tx-standings-scroll-container">
              <div
                className="tx-standings-scroll-content"
                style={{ '--scroll-duration': scrollDuration } as React.CSSProperties}
              >
                <TableRows />
                {/* Duplicate for seamless loop */}
                <TableRows />
              </div>
            </div>
          </>
        ) : (
          /* Static content when it fits */
          <div>
            <TableRows />
          </div>
        )}
      </div>
    </div>
  );
}
