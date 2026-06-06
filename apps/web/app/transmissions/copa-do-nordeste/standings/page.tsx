'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StandingsOverlay from '../../components/StandingsOverlay';

function StandingsContent() {
  const searchParams = useSearchParams();
  const speed = searchParams.get('speed') || 'normal';
  return <StandingsOverlay leagueId={612} competitionName="Copa do Nordeste" speed={speed} />;
}

export default function CopaNordesteStandings() {
  return (
    <Suspense fallback={<div className="tx-loading"><div className="tx-loading-spinner" /><div className="tx-loading-text">CARREGANDO...</div></div>}>
      <StandingsContent />
    </Suspense>
  );
}
