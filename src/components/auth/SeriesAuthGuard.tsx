'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { seriesApi } from '@/lib/apiClient/series';
import { useAuth } from '@/services/auth/AuthContext';

interface SeriesAuthGuardProps {
  children: React.ReactNode;
  seriesId: string;
}

export function SeriesAuthGuard({ children, seriesId }: SeriesAuthGuardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkSeriesAccess = async () => {
      try {
        // If no user is logged in, redirect to sign in
        if (!user) {
          setHasAccess(false);
          setIsLoading(false);
          router.push('/auth/signin');
          return;
        }

        // Check series access through API
        const response = await seriesApi.checkAccess(seriesId);
        
        if (response.error) {
          console.error('Error checking series access:', response.error);
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        setHasAccess(response.data?.hasAccess || false);
        setIsLoading(false);

      } catch (error) {
        console.error('Error checking series access:', error);
        setHasAccess(false);
        setIsLoading(false);
      }
    };

    checkSeriesAccess();
  }, [seriesId, router, user]);

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