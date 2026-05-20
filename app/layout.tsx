import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Opsiyon Dersi Simülatörü',
  description: "Greek'lerin opsiyon fiyatına etkisini interaktif olarak öğrenin",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
