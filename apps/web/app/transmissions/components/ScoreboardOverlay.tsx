'use client';

import { useFixturePolling } from '../hooks/useFixturePolling';

const formatRound = (raw: string) => {
  if (!raw) return '';
  return raw
    .replace(/Regular Season - /gi, 'RODADA ')
    .replace(/Group Stage - /gi, 'FASE ')
    .replace(/Round of 16/gi, 'OITAVAS DE FINAL')
    .replace(/Quarter-finals/gi, 'QUARTAS DE FINAL')
    .replace(/Semi-finals/gi, 'SEMIFINAL')
    .replace(/Final/gi, 'FINAL')
    .replace(/1st Round/gi, '1ª FASE')
    .replace(/2nd Round/gi, '2ª FASE')
    .replace(/3rd Round/gi, '3ª FASE');
};

export default function ScoreboardOverlay({
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
        <div className="tx-loading-text">CARREGANDO DADOS...</div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="tx-empty">
        <div className="tx-empty-icon">⚽</div>
        <div className="tx-empty-text">Nenhuma partida disponível</div>
      </div>
    );
  }

  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(fixture.statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.statusShort);

  const statusClass = isLive
    ? 'tx-status-live'
    : isFinished
      ? 'tx-status-finished'
      : 'tx-status-scheduled';

  const statusText = fixture.statusShort === 'HT'
    ? 'INTERVALO'
    : isLive
      ? `${fixture.elapsed}'`
      : fixture.statusLong || 'AGENDADO';

  return (
    <div className="tx-viewport tx-fade-in">
      <div className="tx-scoreboard">
        {/* Home Team */}
        <div className="tx-team">
          <img
            src={fixture.homeTeam.logo}
            alt={fixture.homeTeam.name}
            className="tx-team-logo"
          />
          <div className="tx-team-name">{fixture.homeTeam.name}</div>
        </div>

        {/* Score Center */}
        <div className="tx-score-center">
          <div className="tx-match-info">
            <div className="tx-round">{formatRound(fixture.round)}</div>
            {fixture.venueName && (
              <div className="tx-venue">
                {fixture.venueName}
                {fixture.venueCity ? ` • ${fixture.venueCity}` : ''}
              </div>
            )}
          </div>

          <div className="tx-score-digits">
            <span>{fixture.homeGoals ?? 0}</span>
            <span className="tx-score-separator">:</span>
            <span>{fixture.awayGoals ?? 0}</span>
          </div>

          <div className={`tx-status-badge ${statusClass}`}>
            {isLive && <span className="tx-live-dot" style={{ marginRight: '0.5vw' }} />}
            {statusText}
          </div>

          {!isLive && !isFinished && (
            <div className="tx-venue" style={{ marginTop: '0.5vh' }}>
              {new Date(fixture.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
              })}{' '}
              às{' '}
              {new Date(fixture.date).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo',
              })}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="tx-team">
          <img
            src={fixture.awayTeam.logo}
            alt={fixture.awayTeam.name}
            className="tx-team-logo"
          />
          <div className="tx-team-name">{fixture.awayTeam.name}</div>
        </div>
      </div>
    </div>
  );
}
