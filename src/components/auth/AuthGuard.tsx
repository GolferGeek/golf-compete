"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import { getSession } from '@/lib/apiClient/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading: isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  useEffect(() => {
    // Function to attempt manual session refresh
    const attemptSessionRefresh = async () => {
      if (refreshAttempts >= 2) {
        // After 2 attempts, give up and redirect to login
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      try {
        setIsRefreshing(true);
        // Try to get the session directly from the API
        const sessionData = await getSession();
        
        if (sessionData?.session) {
          // Session exists, refresh profile data
          await refreshProfile();
          setIsRefreshing(false);
        } else {
          // No session found even after refresh attempt
          setIsRefreshing(false);
          setRefreshAttempts(prev => prev + 1);
          router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
        setIsRefreshing(false);
        setRefreshAttempts(prev => prev + 1);
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    };

    // Only redirect if not loading and no user and not currently refreshing
    if (!isLoading && !user && !isRefreshing) {
      // Try to refresh the session before redirecting
      attemptSessionRefresh();
    }
  }, [user, isLoading, router, refreshProfile, isRefreshing, refreshAttempts]);

  // Show loading while either initial loading or actively refreshing
  if (isLoading || isRefreshing || (!user && refreshAttempts < 2)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If we have a user after all checks, render children
  if (user) {
    return <>{children}</>;
  }

  // This is a fallback and should rarely be visible due to the redirects
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
} 