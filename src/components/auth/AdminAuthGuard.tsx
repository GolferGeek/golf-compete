"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { getSession } from '@/lib/apiClient/auth';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, session, loading: isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  // Function to attempt to refresh the session manually
  const attemptSessionRefresh = async () => {
    if (refreshAttempts >= 2) {
      // After 2 attempts, give up and redirect to login
      router.push('/auth/login?redirect=/admin');
      return;
    }

    try {
      console.log('AdminAuthGuard - Attempting to refresh session manually');
      setIsRefreshing(true);
      
      // Try to get the session directly from the API
      const sessionData = await getSession();
      
      if (sessionData?.session) {
        // Session exists, refresh profile data
        console.log('AdminAuthGuard - Session found, refreshing profile');
        await refreshProfile();
        setIsRefreshing(false);
        // Reset checking to rerun the admin checks
        setIsChecking(true);
      } else {
        // No session found even after refresh attempt
        console.log('AdminAuthGuard - No session found after refresh attempt');
        setIsRefreshing(false);
        setRefreshAttempts(prev => prev + 1);
        
        if (refreshAttempts + 1 >= 2) {
          router.push('/auth/login?redirect=/admin');
        }
      }
    } catch (error) {
      console.error('AdminAuthGuard - Failed to refresh session:', error);
      setIsRefreshing(false);
      setRefreshAttempts(prev => prev + 1);
      
      if (refreshAttempts + 1 >= 2) {
        router.push('/auth/login?redirect=/admin');
      }
    }
  };

  useEffect(() => {
    console.log('AdminAuthGuard - Auth state:', { 
      isLoading, 
      hasUser: !!user, 
      hasProfile: !!profile,
      hasSession: !!session,
      isAdmin: profile?.is_admin,
      refreshAttempts,
      isRefreshing
    });

    // Wait for auth to finish loading
    if (isLoading || isRefreshing) return;

    // If no user and we haven't exhausted refresh attempts
    if (!user && refreshAttempts < 2 && !isRefreshing) {
      console.log('AdminAuthGuard - No user, attempting to refresh session');
      attemptSessionRefresh();
      return;
    }

    // If no user is logged in after refresh attempts, redirect to login
    if (!user) {
      console.log('AdminAuthGuard - No user after refresh, redirecting to login');
      router.push('/auth/login?redirect=/admin');
      return;
    }

    // If user exists but no profile, show error
    if (user && !profile) {
      console.log('AdminAuthGuard - User exists but no profile');
      setError('Error fetching user profile. Please try again later.');
      setIsChecking(false);
      return;
    }

    // Check if user is admin
    if (profile && !profile.is_admin) {
      console.log('AdminAuthGuard - User is not an admin');
      setError('You do not have permission to access this area.');
      setIsChecking(false);
      return;
    }

    // User is admin, allow access
    console.log('AdminAuthGuard - User is admin, allowing access');
    setIsChecking(false);
  }, [isLoading, user, profile, router, session, refreshAttempts, isRefreshing]);

  // Show loading state
  if (isLoading || isChecking || isRefreshing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          {isRefreshing ? 'Refreshing session...' : 'Checking admin access...'}
        </Typography>
      </Box>
    );
  }

  // Show error if any
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Session Debug Info: {session ? 'Session exists' : 'No session'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          User Debug Info: {user ? `User ID: ${user.id}` : 'No user'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Profile Debug Info: {profile ? `Admin: ${profile.is_admin ? 'Yes' : 'No'}` : 'No profile'}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Return to Home
        </Button>
        <Button 
          variant="outlined" 
          onClick={attemptSessionRefresh}
          sx={{ mt: 2 }}
          disabled={isRefreshing}
        >
          Retry Session Refresh
        </Button>
      </Box>
    );
  }

  // User is admin, render children
  return <>{children}</>;
} 