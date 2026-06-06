'use client';

import { useFixturePolling } from '../hooks/useFixturePolling';

export default function LineupsOverlay({
  leagueId,
  fixtureId,
}: {
  leagueId: number;
  fixtureId?: string;
}) {
  const { fixture, loading } = useFixturePolling(leagueId, fixtureId);

  if (loading) {
    return (
      <div className="tx-loading">
        <div className="tx-loading-spinner" />
        <div className="tx-loading-text">CARREGANDO ESCALAÇÕES...</div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="tx-empty">
        <div className="tx-empty-icon">📋</div>
        <div className="tx-empty-text">Nenhuma partida disponível</div>
      </div>
    );
  }

  const lineups = fixture.lineups || [];
  const homeLineup = lineups.filter(
    (l) => l.teamId === fixture.homeTeam.externalId && l.isStart
  );
  const awayLineup = lineups.filter(
    (l) => l.teamId === fixture.awayTeam.externalId && l.isStart
  );

  const posOrder: Record<string, number> = { G: 0, D: 1, M: 2, F: 3 };
  const sortByPos = (a: any, b: any) => (posOrder[a.pos] ?? 9) - (posOrder[b.pos] ?? 9);

  return (
    <div className="tx-viewport tx-fade-in">
      <div className="tx-lineups">
        {/* Home Team */}
        <div className="tx-lineup-team tx-card">
          <div className="tx-lineup-header">
            <img
              src={fixture.homeTeam.logo}
              alt=""
              className="tx-lineup-team-logo"
            />
            <span className="tx-lineup-team-name">{fixture.homeTeam.name}</span>
          </div>
          <div className="tx-lineup-players">
            {homeLineup.length > 0 ? (
              homeLineup.sort(sortByPos).map((p, idx) => (
                <div key={idx} className="tx-lineup-player">
                  <span className="tx-lineup-number">{p.number || '—'}</span>
                  <span className="tx-lineup-name">{p.player}</span>
                  <span className="tx-lineup-pos">{p.pos || '—'}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '3vh', textAlign: 'center', color: 'var(--tx-text-muted)', fontSize: '1.4vh' }}>
                Escalação não disponível
              </div>
            )}
          </div>
        </div>

        {/* Away Team */}
        <div className="tx-lineup-team tx-card">
          <div className="tx-lineup-header">
            <img
              src={fixture.awayTeam.logo}
              alt=""
              className="tx-lineup-team-logo"
            />
            <span className="tx-lineup-team-name">{fixture.awayTeam.name}</span>
          </div>
          <div className="tx-lineup-players">
            {awayLineup.length > 0 ? (
              awayLineup.sort(sortByPos).map((p, idx) => (
                <div key={idx} className="tx-lineup-player">
                  <span className="tx-lineup-number">{p.number || '—'}</span>
                  <span className="tx-lineup-name">{p.player}</span>
                  <span className="tx-lineup-pos">{p.pos || '—'}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '3vh', textAlign: 'center', color: 'var(--tx-text-muted)', fontSize: '1.4vh' }}>
                Escalação não disponível
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
