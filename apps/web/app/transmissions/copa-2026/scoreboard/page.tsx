'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ScoreboardOverlay from '../../components/ScoreboardOverlay';

function ScoreboardContent() {
  const searchParams = useSearchParams();
  const fixtureId = searchParams.get('fixtureId') || undefined;
  return <ScoreboardOverlay leagueId={1} fixtureId={fixtureId} />;
}

export default function Copa2026Scoreboard() {
  return (
    <Suspense fallback={<div className="tx-loading"><div className="tx-loading-spinner" /><div className="tx-loading-text">CARREGANDO...</div></div>}>
      <ScoreboardContent />
    </Suspense>
  );
}
