'use client';

import React, { useState, useEffect } from 'react';

// DADOS ESTÁTICOS PARA EDIÇÃO MANUAL (NÃO USA API)
const MOCK_FIXTURE = {
  statusShort: 'LIVE', // 'NS' (Aguardando), 'LIVE' (Ao vivo), 'FT' (Fim)
  statusLong: 'Ao Vivo',
  elapsed: 12, // Minutos de jogo
  homeGoals: 0,
  awayGoals: 0,
  homeTeam: {
    externalId: 6,
    name: 'Brasil',
    logo: 'https://media.api-sports.io/football/teams/6.png'
  },
  awayTeam: {
    externalId: 32,
    name: 'Egito',
    logo: 'https://media.api-sports.io/football/teams/32.png'
  },
  venueName: 'Estádio do Amistoso',
  venueCity: 'Cidade',
  round: 'Amistoso Internacional',
  referee: 'Árbitro A Definir',
  
  // Exemplo de como adicionar eventos manualmente
  events: [
    // { time: 10, type: 'Card', detail: 'Yellow Card', player: 'Vini Jr', teamId: 6 },
    // { time: 15, type: 'Goal', detail: 'Normal Goal', player: 'Rodrygo', assist: 'Paquetá', teamId: 6 },
  ],
  
  // Exemplo de escalação manual
  lineups: [
    // Brasil
    { teamId: 6, isStart: true, number: 1, player: 'Alisson' },
    { teamId: 6, isStart: true, number: 2, player: 'Danilo' },
    { teamId: 6, isStart: true, number: 3, player: 'Marquinhos' },
    { teamId: 6, isStart: true, number: 4, player: 'Gabriel Magalhães' },
    { teamId: 6, isStart: true, number: 6, player: 'Wendell' },
    { teamId: 6, isStart: true, number: 5, player: 'Bruno Guimarães' },
    { teamId: 6, isStart: true, number: 8, player: 'Lucas Paquetá' },
    { teamId: 6, isStart: true, number: 10, player: 'Rodrygo' },
    { teamId: 6, isStart: true, number: 7, player: 'Vini Jr' },
    { teamId: 6, isStart: true, number: 11, player: 'Raphinha' },
    { teamId: 6, isStart: true, number: 9, player: 'Endrick' },
    // Egito
    { teamId: 32, isStart: true, number: 1, player: 'El Shenawy' },
    { teamId: 32, isStart: true, number: 2, player: 'Gaber' },
    { teamId: 32, isStart: true, number: 6, player: 'Hegazy' },
    { teamId: 32, isStart: true, number: 4, player: 'Abdelmonem' },
    { teamId: 32, isStart: true, number: 13, player: 'Fotouh' },
    { teamId: 32, isStart: true, number: 5, player: 'Hamdi' },
    { teamId: 32, isStart: true, number: 8, player: 'Ashour' },
    { teamId: 32, isStart: true, number: 17, player: 'Elneny' },
    { teamId: 32, isStart: true, number: 10, player: 'Salah' },
    { teamId: 32, isStart: true, number: 7, player: 'Trezeguet' },
    { teamId: 32, isStart: true, number: 11, player: 'Mohamed' },
  ]
};


interface FullOverlayProps {
  leagueId: number;
}

export default function Copa2026FullOverlay({ leagueId }: FullOverlayProps) {
  const [now, setNow] = useState(new Date());

  // Usando dados estáticos editáveis
  const fixture = MOCK_FIXTURE;

  const getLogoUrl = (url: string | undefined | null) => {
    if (!url) return '';
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('pt-BR', { hour12: false });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'].includes(fixture.statusShort);
  const isScheduled = ['NS', 'TBD'].includes(fixture.statusShort);
  const isFinished = ['FT', 'AET', 'PEN'].includes(fixture.statusShort);

  const formatElapsed = () => {
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

  const newsItems = [
    `Amistoso da Seleção`,
    `Acompanhe todos os detalhes de ${fixture.homeTeam.name} x ${fixture.awayTeam.name}.`,
    `Partida realizada em ${fixture.venueName}, ${fixture.venueCity}.`
  ];

  if (fixture.events && fixture.events.length > 0) {
    const lastEvent = fixture.events[fixture.events.length - 1];
    newsItems.push(`ÚLTIMO LANCE: ${lastEvent.time}' - ${lastEvent.type} de ${lastEvent.player} (${lastEvent.detail || ''})`);
  }

  const homePlayers = fixture.lineups?.filter((l: any) => l.teamId === fixture.homeTeam.externalId && l.isStart) || [];
  const awayPlayers = fixture.lineups?.filter((l: any) => l.teamId === fixture.awayTeam.externalId && l.isStart) || [];

  return (
    <div className="tx-full-page tx-fade-in">
      <div className="tx-scanlines"></div>

      <header className="tx-top-bar">
        <div className="tx-badge" style={{ borderColor: 'var(--tx-gold)' }}>
          <span className="tx-badge__top">AMISTOSO</span>
          <span className="tx-badge__mid">🏆</span>
          <span className="tx-badge__bot">TRANSMISSÃO</span>
        </div>

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

        <div className="tx-clocks">
          <div className="tx-clock-card">
            <span className="tx-clock-flag">🌎</span>
            <div className="tx-clock-info">
              <span className="tx-clock-label">AMISTOSO</span>
              <span className="tx-clock-time">{timeStr}</span>
              <span className="tx-clock-date">{dateStr}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="tx-split-layout" style={{ display: 'flex', flex: 1, padding: '20px 40px', gap: '40px', position: 'relative', zIndex: 10 }}>
        
        {/* Lado Esquerdo (Eventos) */}
        <div className="tx-split-card-area" style={{ width: '450px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="tx-card tx-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(var(--tx-gold-rgb), 0.3)', overflow: 'hidden' }}>
            <div className="tx-card-header" style={{ padding: '16px', background: 'linear-gradient(90deg, rgba(var(--tx-gold-rgb),0.2) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em' }}>EVENTOS</span>
            </div>
            <div className="tx-card-body" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div className="tx-events-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(!fixture.events || fixture.events.length === 0) ? (
                  <div className="tx-state-message" style={{marginTop: '40px'}}>Nenhum evento registrado ainda.</div>
                ) : (
                  [...fixture.events].reverse().slice(0, 15).map((event: any, idx: number) => {
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
            </div>
          </div>
        </div>

        {/* Lado Central (Câmera) */}
        <div className="tx-split-camera" style={{ flex: 1, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Vazio para Câmera */}
        </div>

        {/* Lado Direito (Escalação) */}
        <div className="tx-split-card-area" style={{ width: '450px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="tx-card tx-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(var(--tx-gold-rgb), 0.3)', overflow: 'hidden' }}>
            <div className="tx-card-header" style={{ padding: '16px', background: 'linear-gradient(90deg, rgba(var(--tx-gold-rgb),0.2) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em' }}>ESCALAÇÃO</span>
            </div>
            <div className="tx-card-body" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              <div className="tx-lineup-container" style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div className="tx-lineup-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
                    <img src={getLogoUrl(fixture.homeTeam.logo)} alt="" style={{ width: '24px' }} />
                    {fixture.homeTeam.name}
                  </div>
                  <div className="tx-lineup-list">
                    {homePlayers.length > 0 ? homePlayers.map((p: any, i: number) => (
                      <div key={i} className="tx-lineup-item" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ width: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{p.number}</span>
                        <span>{p.player}</span>
                      </div>
                    )) : <div className="tx-state-message">Não disponível</div>}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div className="tx-lineup-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
                    <img src={getLogoUrl(fixture.awayTeam.logo)} alt="" style={{ width: '24px' }} />
                    {fixture.awayTeam.name}
                  </div>
                  <div className="tx-lineup-list">
                    {awayPlayers.length > 0 ? awayPlayers.map((p: any, i: number) => (
                      <div key={i} className="tx-lineup-item" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ width: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>{p.number}</span>
                        <span>{p.player}</span>
                      </div>
                    )) : <div className="tx-state-message">Não disponível</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      <div className="tx-ticker-banner">
        <div className="tx-ticker-title">INFORMAÇÕES</div>
        <div className="tx-ticker-scroll">
          <div className="tx-ticker-content">
            {newsItems.map((n, i) => <span key={`a-${i}`}>• {n}</span>)}
            {newsItems.map((n, i) => <span key={`b-${i}`}>• {n}</span>)}
            {newsItems.map((n, i) => <span key={`c-${i}`}>• {n}</span>)}
          </div>
        </div>
      </div>

    </div>
  );
}
