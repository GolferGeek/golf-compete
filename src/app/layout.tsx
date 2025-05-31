import { Inter } from "next/font/google";
import './globals.css';
import { Metadata } from "next";
import ThemeRegistry from '../theme/ThemeRegistry';
import { AuthProvider } from '@/contexts/AuthContext';
import { GolfAssistantProvider } from '@/contexts/GolfAssistantContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Golf Compete",
  description: "Track your golf competitions and improve your game",
  icons: {
    icon: [
      {
        url: '/golf-flag.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico',
        sizes: '16x16',
        type: 'image/x-icon',
      }
    ],
    shortcut: '/golf-flag.svg',
    apple: '/golf-flag.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/golf-flag.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/golf-flag.svg" />
        <link rel="apple-touch-icon" href="/golf-flag.svg" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeRegistry>
            <GolfAssistantProvider>
              {children}
            </GolfAssistantProvider>
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
