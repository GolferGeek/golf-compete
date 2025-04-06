'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface SeriesAuthGuardProps {
  children: React.ReactNode;
  seriesId: string;
}

export function SeriesAuthGuard({ children, seriesId }: SeriesAuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkSeriesAccess = async () => {
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

        // Check if user is the series creator
        const { data: seriesData } = await supabase
          .from('series')
          .select('created_by')
          .eq('id', seriesId)
          .single();

        if (seriesData && seriesData.created_by === profile.id) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        // If not creator, check if user is a series admin
        const { data: participantData } = await supabase
          .from('series_participants')
          .select('role')
          .eq('series_id', seriesId)
          .eq('user_id', profile.id)
          .eq('role', 'admin')
          .single();

        setHasAccess(!!participantData);
        setIsLoading(false);

      } catch (error) {
        console.error('Error checking series access:', error);
        setHasAccess(false);
        setIsLoading(false);
      }
    };

    checkSeriesAccess();
  }, [seriesId, router]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAccess) {
    router.push('/series');
    return null;
  }

  return <>{children}</>;
} 