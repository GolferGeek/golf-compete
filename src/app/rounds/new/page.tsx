import React from 'react';
import { Metadata } from 'next';
import RoundForm from '@/components/rounds/RoundForm';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'New Round | Golf Compete',
  description: 'Enter a new golf round',
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
  console.log('NewRoundPage searchParams:', searchParams);
  
  return (
    <AuthGuard>
      <RoundForm 
        eventId={searchParams.eventId}
        initialCourseId={searchParams.courseId}
        initialTeeSetId={searchParams.teeSetId}
        initialDate={searchParams.date}
      />
    </AuthGuard>
  );
} 