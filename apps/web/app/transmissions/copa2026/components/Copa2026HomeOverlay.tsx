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
  events: [] as any[],
  
  // Exemplo de escalação manual
  lineups: [
    // Brasil
    { teamId: 6, isStart: true, number: 1, player: 'Alisson' },
    { teamId: 6, isStart: true, number: 2, player: 'Wesley' },
    { teamId: 6, isStart: true, number: 3, player: 'Ibañez' },
    { teamId: 6, isStart: true, number: 4, player: 'Marquinhos' },
    { teamId: 6, isStart: true, number: 6, player: 'Douglas Santos' },
    { teamId: 6, isStart: true, number: 5, player: 'Casemiro' },
    { teamId: 6, isStart: true, number: 8, player: 'Bruno Guimarães' },
    { teamId: 6, isStart: true, number: 10, player: 'Lucas Paquetá' },
    { teamId: 6, isStart: true, number: 11, player: 'Raphinha' },
    { teamId: 6, isStart: true, number: 9, player: 'Igor Thiago' },
    { teamId: 6, isStart: true, number: 7, player: 'Vinicius Jr.' },
    // Egito
    { teamId: 32, isStart: true, number: 1, player: 'Mostafa Shobeir' },
    { teamId: 32, isStart: true, number: 2, player: 'Mohamed Hany' },
    { teamId: 32, isStart: true, number: 3, player: 'Mohamed Hamdi' },
    { teamId: 32, isStart: true, number: 4, player: 'Yasser Ibrahim' },
    { teamId: 32, isStart: true, number: 13, player: 'Ahmed Fatouh' },
    { teamId: 32, isStart: true, number: 5, player: 'Marwan Attia' },
    { teamId: 32, isStart: true, number: 8, player: 'Mohanad Lasheen' },
    { teamId: 32, isStart: true, number: 10, player: 'Ziko' },
    { teamId: 32, isStart: true, number: 7, player: 'Mahmoud Trézéguet' },
    { teamId: 32, isStart: true, number: 9, player: 'Haytham' },
    { teamId: 32, isStart: true, number: 11, player: 'Omar Marmoush' },
  ]
};

interface HomeOverlayProps {
  leagueId: number;
}

export default function Copa2026HomeOverlay({ leagueId }: HomeOverlayProps) {
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

  return (
    <div className="tx-full-page tx-fade-in" style={{ justifyContent: 'space-between', paddingBottom: '40px' }}>
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

      <div className="tx-home-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '80px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <img src={getLogoUrl(fixture.homeTeam.logo)} alt="" style={{ width: '250px', height: '250px', objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.2))' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{fixture.homeTeam.name}</span>
          </div>

          <div style={{ fontFamily: 'var(--font-disp)', fontSize: '5rem', color: 'var(--tx-gold)', textShadow: '0 0 20px rgba(var(--tx-gold-rgb), 0.5)' }}>
            X
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <img src={getLogoUrl(fixture.awayTeam.logo)} alt="" style={{ width: '250px', height: '250px', objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.2))' }} />
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{fixture.awayTeam.name}</span>
          </div>
        </div>

        <div style={{ 
          background: 'rgba(0,0,0,0.7)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(var(--tx-gold-rgb), 0.3)',
          borderRadius: '16px',
          padding: '24px 48px',
          display: 'flex',
          gap: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>ESTÁDIO</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.venueName || 'A definir'}</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>CIDADE</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.venueCity || 'A definir'}</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>RODADA</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.round || 'Amistoso'}</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: 'var(--tx-gold)', fontFamily: 'var(--font-head)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>ÁRBITRO</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{(fixture as any).referee || 'A definir'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
