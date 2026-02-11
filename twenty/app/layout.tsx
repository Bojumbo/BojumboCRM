import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { NextAuthProvider } from '@/components/providers/session-provider';
import LayoutContent from '@/components/layout-content';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BojumboCRM',
  description: 'A minimalist CRM for modern teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <NextAuthProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
          <Toaster />
        </NextAuthProvider>
      </body>
    </html>
  );
}
