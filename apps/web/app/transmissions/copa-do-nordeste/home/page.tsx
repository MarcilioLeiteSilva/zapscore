import { Suspense } from 'react';
import HomeOverlay from '../../components/HomeOverlay';

export default function HomeTransmissionPage() {
  // Copa do Nordeste league ID = 612
  // We can pass this as prop. The hook currently supports single league or fixture.
  return (
    <Suspense fallback={<div className="tx-full-page" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="tx-spinner"></div></div>}>
      <HomeOverlay leagueId={612} />
    </Suspense>
  );
}
