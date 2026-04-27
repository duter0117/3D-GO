import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '3D GO — 空間圍棋',
  description: '在三維空間中體驗全新規則的圍棋對戰。每回合落兩子，挑戰空間思維的極限。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body style={{ background: '#e8ecf4', margin: 0 }}>{children}</body>
    </html>
  );
}
