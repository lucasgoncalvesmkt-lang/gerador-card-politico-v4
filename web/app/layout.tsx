
import './globals.css';

export const metadata = {
  title: 'Gerador de Card Político',
  description: 'Gere cards de apoio com recorte automático.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
