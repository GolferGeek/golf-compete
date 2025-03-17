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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
