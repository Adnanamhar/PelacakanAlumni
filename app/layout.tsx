import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alumni Tracker - UMM',
  description: 'Sistem Pelacakan Alumni Universitas Muhammadiyah Malang',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
