import './transmissions.css';

export const metadata = {
  title: 'ZapScore Transmissão',
  description: 'Overlays para transmissão.',
};

export default function TransmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Adicione as fontes do Google se necessário, embora já estejam importadas no transmissions.css via @import */}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
