'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EventsOverlay from '../../components/EventsOverlay';

function EventsContent() {
  const searchParams = useSearchParams();
  const fixtureId = searchParams.get('fixtureId') || undefined;
  return <EventsOverlay leagueId={1} fixtureId={fixtureId} />;
}

export default function Copa2026Events() {
  return (
    <Suspense fallback={<div className="tx-loading"><div className="tx-loading-spinner" /><div className="tx-loading-text">CARREGANDO...</div></div>}>
      <EventsContent />
    </Suspense>
  );
}
