import './globals.css';

export const metadata = {
  title: 'ZapScore | Plataforma de Futebol',
  description: 'Plataforma definitiva de dados para competições brasileiras e internacionais.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#020205] text-slate-100 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
