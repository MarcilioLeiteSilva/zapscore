'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StatsOverlay from '../../components/StatsOverlay';

function StatsContent() {
  const searchParams = useSearchParams();
  const fixtureId = searchParams.get('fixtureId') || undefined;
  const speed = searchParams.get('speed') || 'normal';
  return <StatsOverlay leagueId={1} fixtureId={fixtureId} speed={speed} />;
}

export default function Copa2026Stats() {
  return (
    <Suspense fallback={<div className="tx-loading"><div className="tx-loading-spinner" /><div className="tx-loading-text">CARREGANDO...</div></div>}>
      <StatsContent />
    </Suspense>
  );
}
