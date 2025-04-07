'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
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
        const supabase = getSupabaseBrowserClient();

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error('Error getting session:', sessionError);
          setHasAccess(false);
          setIsLoading(false);
          router.push('/auth/signin');
          return;
        }

        // Get the current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, is_admin')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error getting profile:', profileError);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // If user is a global admin, grant access
        if (profile.is_admin) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        // Check if user is the series creator
        const { data: seriesData, error: seriesError } = await supabase
          .from('series')
          .select('created_by')
          .eq('id', seriesId)
          .single();

        if (seriesError) {
          console.error('Error checking series:', seriesError);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        if (seriesData && seriesData.created_by === profile.id) {
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        // If not creator, check if user is a series participant with admin role
        const { data: participantData, error: participantError } = await supabase
          .from('series_participants')
          .select('role, status')
          .eq('series_id', seriesId)
          .eq('user_id', profile.id)
          .single();

        if (participantError) {
          console.error('Error checking participant status:', participantError);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Grant access if user is an active admin participant
        setHasAccess(
          !!participantData && 
          participantData.role === 'admin' && 
          participantData.status === 'active'
        );
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