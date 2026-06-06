'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StandingsOverlay from '../../components/StandingsOverlay';

function StandingsContent() {
  const searchParams = useSearchParams();
  const speed = searchParams.get('speed') || 'normal';
  return <StandingsOverlay leagueId={1} competitionName="Copa do Mundo FIFA 2026" speed={speed} />;
}

export default function Copa2026Standings() {
  return (
    <Suspense fallback={<div className="tx-loading"><div className="tx-loading-spinner" /><div className="tx-loading-text">CARREGANDO...</div></div>}>
      <StandingsContent />
    </Suspense>
  );
}
