'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase'
import { getBrowserClient } from '@/lib/supabase-browser'
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material'

// Create a client component that uses the search params
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('Processing authentication...')

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | null = null;

    const handleAuthCallback = async () => {
      try {
        // Log all URL parameters for debugging
        console.log('Auth callback URL parameters:');
        searchParams.forEach((value, key) => {
          console.log(`${key}: ${value}`);
        });
        
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        
        if (error) {
          console.error('Auth error:', error, error_description);
          setError(`Authentication error: ${error_description || error}`);
          redirectTimeout = setTimeout(() => {
            router.push('/auth/login');
          }, 5000);
          return;
        }
        
        if (!code) {
          console.error('No code found in URL')
          setError('Authentication code missing. Please try signing in again.')
          redirectTimeout = setTimeout(() => {
            router.push('/auth/login');
          }, 5000);
          return
        }
        
        setMessage('Processing authentication...')
        console.log('Auth callback processing with code:', code.substring(0, 10) + '...')
        
        try {
          // Get the browser client for consistent auth handling
          const supabase = getBrowserClient();
          
          if (!supabase) {
            console.error('Failed to initialize Supabase client')
            setError('Authentication service unavailable. Please try again later.')
            redirectTimeout = setTimeout(() => {
              router.push('/auth/login');
            }, 5000);
            return;
          }
          
          // Let Supabase handle the code exchange automatically
          // The library should handle the code verifier from localStorage
          console.log('Letting Supabase handle code exchange automatically...');
          
          // Wait a moment to ensure the auth state is updated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if we have a session after the automatic exchange
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session after code exchange:', sessionError);
            setError('Error verifying your session. Please try signing in again.');
            redirectTimeout = setTimeout(() => {
              router.push('/auth/login');
            }, 5000);
            return;
          }
          
          if (!sessionData.session) {
            console.log('No session found after automatic exchange, trying manual exchange...');
            
            // Try manual exchange as fallback
            try {
              const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              
              if (exchangeError) {
                console.error('Error exchanging code for session:', exchangeError);
                setError('Authentication failed. Please try signing in again.');
                redirectTimeout = setTimeout(() => {
                  router.push('/auth/login');
                }, 5000);
                return;
              }
              
              if (!data.session) {
                console.error('No session returned after manual code exchange');
                setError('Unable to establish a session. Please try signing in again.');
                redirectTimeout = setTimeout(() => {
                  router.push('/auth/login');
                }, 5000);
                return;
              }
              
              console.log('Session established successfully via manual exchange');
              await handleUserSession(data.session.user.id);
            } catch (exchangeErr) {
              console.error('Exception during manual code exchange:', exchangeErr);
              setError('Authentication failed. Please try signing in again.');
              redirectTimeout = setTimeout(() => {
                router.push('/auth/login');
              }, 5000);
            }
          } else {
            console.log('Session found after automatic exchange');
            await handleUserSession(sessionData.session.user.id);
          }
        } catch (error) {
          console.error('Unexpected error in auth callback:', error)
          setError('An unexpected error occurred. Please try signing in again.')
          redirectTimeout = setTimeout(() => {
            router.push('/auth/login');
          }, 5000);
        }
      } catch (error) {
        console.error('Top level error in auth callback:', error)
        setError('An unexpected error occurred. Please try signing in again.')
        redirectTimeout = setTimeout(() => {
          router.push('/auth/login');
        }, 5000);
      }
    }

    const handleUserSession = async (userId: string) => {
      try {
        setMessage('Checking user profile...')
        
        const { data: profileData, error: profileError } = await getUserProfile(userId)
          
        if (profileError && 
            typeof profileError === 'object' && 
            'code' in profileError && 
            profileError.code !== 'PGRST116') {
          console.error('Error checking user profile:', profileError)
          setMessage('Sign in successful! Redirecting...')
          redirectTimeout = setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          return
        }
        
        if (!profileData) {
          setMessage('Redirecting to complete your profile...')
          redirectTimeout = setTimeout(() => {
            router.push('/onboarding');
          }, 1000);
        } else {
          setMessage('Sign in successful! Redirecting...')
          redirectTimeout = setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      } catch (profileErr) {
        console.error('Error handling user session:', profileErr)
        setMessage('Sign in successful! Redirecting...')
        redirectTimeout = setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    }

    // Start the auth process immediately
    handleAuthCallback();
    
    // Clean up any timeouts when component unmounts
    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [router, searchParams])

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        p: 2
      }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Redirecting you back to login...
        </Typography>
        <Button onClick={() => router.push('/auth/login')} variant="contained">
          Go to Login
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      p: 2
    }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3, textAlign: 'center' }}>
        {message}
      </Typography>
    </Box>
  );
}

// Loading fallback for the Suspense boundary
function AuthCallbackLoading() {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      p: 2
    }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3, textAlign: 'center' }}>
        Loading authentication...
      </Typography>
    </Box>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

// Add dynamic configuration to prevent static generation
export const dynamic = 'force-dynamic';