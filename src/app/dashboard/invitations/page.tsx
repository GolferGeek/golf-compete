import React from 'react';
import { Metadata } from 'next';
import { AuthGuard } from '@/components/auth/AuthGuard';
import SeriesInvitationsManagement from '@/components/series/SeriesInvitationsManagement';

export const metadata: Metadata = {
  title: 'Series Invitations | Golf Compete',
  description: 'View and manage your series invitations',
};

export default function SeriesInvitationsPage() {
  return (
    <AuthGuard>
      <SeriesInvitationsManagement />
    </AuthGuard>
  );
} 