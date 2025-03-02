import React from 'react';
import { Metadata } from 'next';
import ThemeRegistry from '@/theme/ThemeRegistry';

export const metadata: Metadata = {
  title: 'Login - Golf Compete',
  description: 'Log in to Golf Compete admin panel',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeRegistry>
      {children}
    </ThemeRegistry>
  );
}
