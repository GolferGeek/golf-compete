import React from 'react';
import { Metadata } from 'next';
import StartRound from '@/components/rounds/StartRound';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Start Round | Golf Compete',
  description: 'Start a new simplified golf round',
};

interface NewRoundPageProps {
  searchParams: {
    eventId?: string;
    courseId?: string;
    teeSetId?: string;
    date?: string;
  };
}

export default function NewRoundPage({ searchParams }: NewRoundPageProps) {
  return (
    <AuthGuard>
      <StartRound 
        eventId={searchParams.eventId}
        initialCourseId={searchParams.courseId}
        initialTeeSetId={searchParams.teeSetId}
        initialDate={searchParams.date}
      />
    </AuthGuard>
  );
} 