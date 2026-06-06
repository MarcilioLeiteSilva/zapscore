import './transmissions.css';

export const metadata = {
  title: 'ZapScore Transmissões | OBS Overlay',
  description: 'Overlays de transmissão para OBS Studio',
};

export default function TransmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
