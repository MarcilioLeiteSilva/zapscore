'use client';

import { useFixturePolling } from '../hooks/useFixturePolling';

function getEventIcon(type: string, detail: string) {
  if (type === 'Goal') return '⚽';
  if (type === 'Card' && detail?.includes('Yellow')) return null; // use CSS class
  if (type === 'Card' && detail?.includes('Red')) return null;
  if (type === 'subst') return '🔄';
  if (type === 'Var') return '📺';
  return '📋';
}

function getEventCardClass(type: string, detail: string) {
  if (type === 'Card' && detail?.includes('Yellow')) return 'tx-card-yellow';
  if (type === 'Card' && detail?.includes('Red')) return 'tx-card-red';
  return '';
}

export default function EventsOverlay({
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
        <div className="tx-loading-text">CARREGANDO EVENTOS...</div>
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

  const events = fixture.events || [];
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(fixture.statusShort);

  // Show last 8 events (most recent first for live, chronological for finished)
  const displayEvents = isLive
    ? [...events].reverse().slice(0, 8)
    : events.slice(-8);

  return (
    <div className="tx-viewport tx-fade-in">
      <div className="tx-events tx-card">
        {/* Header with teams + score */}
        <div className="tx-events-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1vw' }}>
            <img src={fixture.homeTeam.logo} alt="" style={{ width: '3.5vh', height: '3.5vh', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '2vh' }}>
              {fixture.homeGoals ?? 0}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '2vh' }}>:</span>
            <span style={{ fontWeight: 800, fontSize: '2vh' }}>
              {fixture.awayGoals ?? 0}
            </span>
            <img src={fixture.awayTeam.logo} alt="" style={{ width: '3.5vh', height: '3.5vh', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5vw' }}>
            {isLive && <span className="tx-live-dot" />}
            <span className="tx-events-title" style={{ fontSize: '1.6vh' }}>
              {isLive ? `AO VIVO • ${fixture.elapsed}'` : fixture.statusLong}
            </span>
          </div>
        </div>

        {/* Events List */}
        {displayEvents.length > 0 ? (
          displayEvents.map((event, idx) => {
            const icon = getEventIcon(event.type, event.detail);
            const cardClass = getEventCardClass(event.type, event.detail);
            const isHome = event.teamId === fixture.homeTeam.externalId;

            return (
              <div key={idx} className="tx-event-item tx-card" style={{ background: event.type === 'Goal' ? 'rgba(255, 31, 31, 0.05)' : undefined }}>
                <div className="tx-event-time">{event.time}&apos;</div>
                <div className="tx-event-icon">
                  {cardClass ? <span className={cardClass} /> : icon}
                </div>
                <div className="tx-event-content">
                  <div className="tx-event-player">{event.player || '—'}</div>
                  <div className="tx-event-detail">
                    {event.detail}
                    {event.assist && <span style={{ opacity: 0.6 }}> • Ass: {event.assist}</span>}
                  </div>
                </div>
                <img
                  src={isHome ? fixture.homeTeam.logo : fixture.awayTeam.logo}
                  alt=""
                  className="tx-event-team-logo"
                />
              </div>
            );
          })
        ) : (
          <div style={{ padding: '4vh', textAlign: 'center', color: 'var(--tx-text-muted)', fontSize: '1.6vh' }}>
            Aguardando eventos da partida...
          </div>
        )}
      </div>
    </div>
  );
}
