import { Inter } from "next/font/google";
import './globals.css';
import { Metadata } from "next";
import ThemeRegistry from '../theme/ThemeRegistry';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GolfCompete",
  description: "A comprehensive golf competition and improvement platform designed to transform how golfers compete, track progress, and enhance their skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
