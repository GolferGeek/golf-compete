'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { checkEventAccess } from '@/lib/supabase';

interface EventScorecardAuthGuardProps {
  children: React.ReactNode;
  eventId: string;
}

export function EventScorecardAuthGuard({ children, eventId }: EventScorecardAuthGuardProps) {
  const router = useRouter();
  const { profile, supabase, loading: authLoading } = useAuth();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (authLoading || !profile || !supabase || !eventId) {
      if (authLoading) {
        setIsCheckingAccess(true);
      } else {
        setHasAccess(false);
        setIsCheckingAccess(false);
      }
      return;
    }

    const performAccessCheck = async () => {
      try {
        console.log(`Auth loaded, performing access check for event: ${eventId}`);
        const accessGranted = await checkEventAccess(supabase, profile.id, eventId);
        setHasAccess(accessGranted);
      } catch (error) {
        console.error('Error during access check:', error);
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    performAccessCheck();

  }, [eventId, router, profile, supabase, authLoading]);

  if (authLoading || isCheckingAccess) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess) {
    console.log('Access denied. Redirecting to /events');
    router.replace('/events');
    return null;
  }

  return <>{children}</>;
} 