'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LineupsOverlay from '../../components/LineupsOverlay';

function LineupsContent() {
  const searchParams = useSearchParams();
  const fixtureId = searchParams.get('fixtureId') || undefined;
  return <LineupsOverlay leagueId={612} fixtureId={fixtureId} />;
}

export default function CopaNordesteLineups() {
  return (
    <Suspense fallback={<div className="tx-loading"><div className="tx-loading-spinner" /><div className="tx-loading-text">CARREGANDO...</div></div>}>
      <LineupsContent />
    </Suspense>
  );
}
