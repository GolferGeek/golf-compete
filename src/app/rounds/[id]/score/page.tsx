"use client";

import React from 'react';
import { Metadata } from 'next';
import ScoreEntryForm from '@/components/rounds/ScoreEntryForm';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Enter Scores | Golf Compete',
  description: 'Enter hole scores for your round',
};

interface ScoreEntryPageProps {
  params: {
    id: string;
  };
}

export default function ScoreEntryPage({ params }: ScoreEntryPageProps) {
  return (
    <AuthGuard>
      <ScoreEntryForm roundId={params.id} />
    </AuthGuard>
  );
} 