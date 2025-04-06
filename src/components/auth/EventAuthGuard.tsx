'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface EventAuthGuardProps {
  children: React.ReactNode;
  eventId: string;
}

export function EventAuthGuard({ children, eventId }: EventAuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkEventAccess = async () => {
      try {
        const supabase = createClientComponentClient<Database>();

        // Get the current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .single();

        if (profileError || !profile) {
          console.error('Error getting profile:', profileError);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Get the event and its series info
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            created_by,
            series_events!inner (
              series_id
            )
          `)
          .eq('id', eventId)
          .single();

        if (eventError || !eventData) {
          console.error('Error getting event:', eventError);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Check if user is the event creator
        if (eventData.created_by === profile.id) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        // Check if user is a series admin
        const { data: seriesParticipantData } = await supabase
          .from('series_participants')
          .select('role')
          .eq('series_id', eventData.series_events[0].series_id)
          .eq('user_id', profile.id)
          .eq('role', 'admin')
          .single();

        setHasAccess(!!seriesParticipantData);
        setIsLoading(false);

      } catch (error) {
        console.error('Error checking event access:', error);
        setHasAccess(false);
        setIsLoading(false);
      }
    };

    checkEventAccess();
  }, [eventId, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess) {
    router.push('/events');
    return null;
  }

  return <>{children}</>;
} 