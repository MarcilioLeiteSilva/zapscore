'use client';

import React, { useState, useEffect } from 'react';
import { useFixturePolling } from '../hooks/useFixturePolling';

interface FullOverlayProps {
  leagueId: number;
}

export default function FullOverlay({ leagueId }: FullOverlayProps) {
  const { fixture, loading, error } = useFixturePolling(leagueId, undefined, 15000);
  const [activeTab, setActiveTab] = useState(2); // Fixado em EVENTOS
  const [now, setNow] = useState(new Date());

  const getLogoUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Carousel desativado temporariamente a pedido do usuário
  // useEffect(() => {
  //   const tabTimer = setInterval(() => {
  //     setActiveTab((prev) => (prev + 1) % 4);
  //   }, 10000); // 10s
  //   return () => clearInterval(tabTimer);
  // }, []);

  const timeStr = now.toLocaleTimeString('pt-BR', { hour12: false });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="tx-full-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="tx-spinner"></div>
      </div>
    );
  }

  if (error || !fixture) {
    return (
      <div className="tx-full-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="tx-state-message">Aguardando Partida...</div>
      </div>
    );
  }

  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(fixture.statusShort);
  const isScheduled = ['NS', 'TBD'].includes(fixture.statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.statusShort);

  const formatElapsed = () => {
    if (fixture.statusShort === 'HT') return 'INTERVALO';
    if (isScheduled) return fixture.statusLong;
    if (isFinished) return 'FIM DE JOGO';
    return fixture.elapsed ? `${fixture.elapsed}'` : fixture.statusShort;
  };

  const getLiveTagClass = () => {
    if (isFinished) return 'tx-live-tag tx-live-tag-finished';
    if (isScheduled) return 'tx-live-tag tx-live-tag-scheduled';
    return 'tx-live-tag';
  };

  const getLiveTagText = () => {
    if (isFinished) return 'ENCERRADO';
    if (isScheduled) return 'AGUARDANDO';
    return 'AO VIVO';
  };

  // Mocked news or from fixture events if any
  const newsItems = [
    `Copa do Nordeste: A grande decisão está na tela!`,
    `Acompanhe todos os detalhes de ${fixture.homeTeam.name} x ${fixture.awayTeam.name}.`,
    `Partida realizada em ${fixture.venueName}, ${fixture.venueCity}.`
  ];

  if (fixture.events && fixture.events.length > 0) {
    const lastEvent = fixture.events[fixture.events.length - 1];
    newsItems.push(`ÚLTIMO LANCE: ${lastEvent.time}' - ${lastEvent.type} de ${lastEvent.player} (${lastEvent.detail})`);
  }

  // Calculate possession manually if not in stats (API-football might not provide it immediately)
  const homeStats = fixture.stats?.filter(s => s.teamId === fixture.homeTeam.externalId) || [];
  const awayStats = fixture.stats?.filter(s => s.teamId === fixture.awayTeam.externalId) || [];

  const getStatValue = (stats: any[], type: string) => {
    const s = stats.find(st => st.type === type);
    return s ? s.value : '0';
  };

  const parseStat = (val: string) => {
    if (!val) return 0;
    if (val.includes('%')) return parseInt(val.replace('%', ''));
    return parseInt(val);
  };

  const statsList = [
    { name: 'Posse de Bola', type: 'Ball Possession', showPercent: true },
    { name: 'Finalizações', type: 'Total Shots', showPercent: false },
    { name: 'Escanteios', type: 'Corner Kicks', showPercent: false },
    { name: 'Faltas', type: 'Fouls', showPercent: false },
    { name: 'Cartões Amarelos', type: 'Yellow Cards', showPercent: false },
  ];

  const homeLineup = fixture.lineups?.find(l => l.teamId === fixture.homeTeam.externalId) || null;
  const awayLineup = fixture.lineups?.find(l => l.teamId === fixture.awayTeam.externalId) || null;
  
  // Actually, API returns an array of players per team if my interface is right, or grouped?
  // Our mapped schema: lineups is Array<{teamId, player, number, pos, isStart}>
  const homePlayers = fixture.lineups?.filter(l => l.teamId === fixture.homeTeam.externalId && l.isStart) || [];
  const awayPlayers = fixture.lineups?.filter(l => l.teamId === fixture.awayTeam.externalId && l.isStart) || [];

  return (
    <div className="tx-full-page tx-fade-in">
      <div className="tx-scanlines"></div>

      {/* TOP BAR */}
      <header className="tx-top-bar">
        <div className="tx-badge" style={{ borderColor: 'var(--tx-green)' }}>
          <span className="tx-badge__top">C. DO NORDESTE</span>
          <span className="tx-badge__mid">🏆</span>
          <span className="tx-badge__bot">TRANSMISSÃO</span>
        </div>

        {/* Center Score */}
        <div className="tx-score-banner-wrapper">
          <div className="tx-score-banner">
            <span className="tx-score-team">{fixture.homeTeam.name.substring(0, 3).toUpperCase()}</span>
            <img src={getLogoUrl(fixture.homeTeam.logo)} alt="" className="tx-score-logo" />
            <span className="tx-score-digits">{fixture.homeGoals ?? 0}</span>
            <span className="tx-score-separator">:</span>
            <span className="tx-score-digits">{fixture.awayGoals ?? 0}</span>
            <img src={getLogoUrl(fixture.awayTeam.logo)} alt="" className="tx-score-logo" />
            <span className="tx-score-team">{fixture.awayTeam.name.substring(0, 3).toUpperCase()}</span>
            
            <div className={getLiveTagClass()}>
              <span className="tx-indicator-dot"></span>
              {getLiveTagText()}
              {isLive && <span style={{ marginLeft: '4px' }}>{formatElapsed()}</span>}
            </div>
          </div>
        </div>

        {/* Right Clocks */}
        <div className="tx-clocks">
          <div className="tx-clock-card">
            <span className="tx-clock-flag">🇧🇷</span>
            <div className="tx-clock-info">
              <span className="tx-clock-label">HORÁRIO DE BRASÍLIA</span>
              <span className="tx-clock-time">{timeStr}</span>
              <span className="tx-clock-date">{dateStr}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT SPLIT */}
      <div className="tx-content-split">
        {/* Left: Transparent Video Placeholder */}
        <div className="tx-video-area">
          {/* OBS video goes here */}
        </div>

        {/* Right: Carousel */}
        <div className="tx-carousel-card">
          <div className="tx-tabs-header">
            <button className={`tx-tab-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>ESCALAÇÃO</button>
            <button className={`tx-tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>ESTATÍSTICAS</button>
            <button className={`tx-tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>EVENTOS</button>
            <button className={`tx-tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>PARTIDA</button>
          </div>

          <div className="tx-carousel-content">
            {activeTab === 0 && (
              <div className="tx-lineup-split tx-fade-in">
                {/* Home Lineup */}
                <div>
                  <div className="tx-lineup-title">
                    <img src={getLogoUrl(fixture.homeTeam.logo)} alt="" />
                    {fixture.homeTeam.name}
                  </div>
                  <div className="tx-lineup-list">
                    {homePlayers.length > 0 ? homePlayers.map((p, i) => (
                      <div key={i} className="tx-lineup-item">
                        <span className="tx-lineup-num">{p.number}</span>
                        <span>{p.player}</span>
                      </div>
                    )) : <div className="tx-state-message" style={{height: '100px'}}>Não disponível</div>}
                  </div>
                </div>

                {/* Away Lineup */}
                <div>
                  <div className="tx-lineup-title">
                    <img src={getLogoUrl(fixture.awayTeam.logo)} alt="" />
                    {fixture.awayTeam.name}
                  </div>
                  <div className="tx-lineup-list">
                    {awayPlayers.length > 0 ? awayPlayers.map((p, i) => (
                      <div key={i} className="tx-lineup-item">
                        <span className="tx-lineup-num">{p.number}</span>
                        <span>{p.player}</span>
                      </div>
                    )) : <div className="tx-state-message" style={{height: '100px'}}>Não disponível</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="tx-stats-list tx-fade-in">
                {statsList.map((stat, i) => {
                  const hValStr = getStatValue(homeStats, stat.type);
                  const aValStr = getStatValue(awayStats, stat.type);
                  const hVal = parseStat(hValStr);
                  const aVal = parseStat(aValStr);
                  const total = hVal + aVal;
                  const hPct = total > 0 ? (hVal / total) * 100 : 50;
                  const aPct = total > 0 ? (aVal / total) * 100 : 50;

                  return (
                    <div className="tx-stat-row" key={i}>
                      <div className="tx-stat-labels">
                        <span>{hValStr || '0'}</span>
                        <span className="tx-stat-name">{stat.name}</span>
                        <span>{aValStr || '0'}</span>
                      </div>
                      <div className="tx-bar-outer">
                        <div className="tx-bar-home" style={{ width: `${hPct}%` }}></div>
                        <div className="tx-bar-away" style={{ width: `${aPct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                
                {(!fixture.stats || fixture.stats.length === 0) && (
                  <div className="tx-state-message" style={{marginTop: '40px'}}>
                    Estatísticas não disponíveis no momento.
                  </div>
                )}
              </div>
            )}

            {activeTab === 2 && (
              <div className="tx-events-list tx-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!fixture.events || fixture.events.length === 0) ? (
                  <div className="tx-state-message" style={{marginTop: '40px'}}>Nenhum evento registrado ainda.</div>
                ) : (
                  [...fixture.events].reverse().slice(0, 10).map((event, idx) => {
                    const isGoal = event.type === 'Goal';
                    const isYellow = event.type === 'Card' && event.detail?.includes('Yellow');
                    const isRed = event.type === 'Card' && event.detail?.includes('Red');
                    const isSubst = event.type === 'subst';
                    const icon = isGoal ? '⚽' : isSubst ? '🔄' : '📋';
                    
                    return (
                      <div key={idx} style={{ 
                        display: 'flex', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', 
                        borderRadius: '8px', borderLeft: isGoal ? '4px solid var(--tx-green)' : '4px solid transparent' 
                      }}>
                        <div style={{ width: '40px', fontWeight: 'bold', color: 'var(--tx-gold)' }}>{event.time}'</div>
                        <div style={{ width: '40px', fontSize: '1.2rem', textAlign: 'center' }}>
                          {isYellow ? <span style={{display: 'inline-block', width: '12px', height: '16px', background: '#facc15', borderRadius: '2px'}}></span> : 
                           isRed ? <span style={{display: 'inline-block', width: '12px', height: '16px', background: '#ef4444', borderRadius: '2px'}}></span> : icon}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold' }}>{event.player}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{event.detail} {event.assist ? `(Ass: ${event.assist})` : ''}</span>
                        </div>
                        <img src={getLogoUrl(event.teamId === fixture.homeTeam.externalId ? fixture.homeTeam.logo : fixture.awayTeam.logo)} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 3 && (
              <div className="tx-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', height: '100%', padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>ESTÁDIO</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', textAlign: 'center' }}>{fixture.venueName || 'A definir'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                  <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>CIDADE</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', textAlign: 'center' }}>{fixture.venueCity || 'A definir'}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>RODADA</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.round || '-'}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>ÁRBITRO</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>{(fixture as any).referee || 'A definir'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM TICKER */}
      <div className="tx-ticker-banner">
        <div className="tx-ticker-title">INFORMAÇÕES DA PARTIDA</div>
        <div className="tx-ticker-scroll">
          <div className="tx-ticker-content">
            {/* Duplicated for smooth infinite scroll */}
            {newsItems.map((n, i) => <span key={`a-${i}`}>• {n}</span>)}
            {newsItems.map((n, i) => <span key={`b-${i}`}>• {n}</span>)}
            {newsItems.map((n, i) => <span key={`c-${i}`}>• {n}</span>)}
            {newsItems.map((n, i) => <span key={`d-${i}`}>• {n}</span>)}
          </div>
        </div>
      </div>

    </div>
  );
}
