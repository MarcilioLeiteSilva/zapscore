import { Suspense } from 'react';
import FullOverlay from '../../components/FullOverlay';

export default function FullTransmissionPage() {
  // Copa do Nordeste league ID = 612
  return (
    <Suspense fallback={null}>
      <FullOverlay leagueId={612} />
    </Suspense>
  );
}
