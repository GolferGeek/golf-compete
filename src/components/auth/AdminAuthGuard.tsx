"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, session, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AdminAuthGuard - Auth state:', { 
      isLoading, 
      hasUser: !!user, 
      hasProfile: !!profile,
      hasSession: !!session,
      isAdmin: profile?.is_admin
    });

    // Wait for auth to finish loading
    if (isLoading) return;

    // If no user is logged in, redirect to login
    if (!user) {
      console.log('AdminAuthGuard - No user, redirecting to login');
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
  }, [isLoading, user, profile, router, session]);

  // Show loading state
  if (isLoading || isChecking) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Checking admin access...
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
      </Box>
    );
  }

  // User is admin, render children
  return <>{children}</>;
} 