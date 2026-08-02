import './globals.css';

export const metadata = {
  title: 'ZapScore | Inteligência em Futebol',
  description: 'Plataforma definitiva de dados para competições brasileiras e internacionais.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
