"use client";

import React, { Suspense } from 'react';
import QuickScoreCard from '@/components/rounds/QuickScoreCard';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CircularProgress, Box } from '@mui/material';

interface ScoreEntryPageProps {
  params: Promise<{
    id: string;
  }>;
}

function ScoreEntry({ roundId }: { roundId: string }) {
  return (
    <AuthGuard>
      <QuickScoreCard roundId={roundId} />
    </AuthGuard>
  );
}

export default function ScoreEntryPage({ params }: ScoreEntryPageProps) {
  const resolvedParams = React.use(params);
  
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ScoreEntry roundId={resolvedParams.id} />
    </Suspense>
  );
} 