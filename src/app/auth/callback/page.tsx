'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase'
import { getBrowserClient } from '@/lib/supabase-browser'
import { Box, CircularProgress, Typography, Button } from '@mui/material'

// Create a client component that uses the search params
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string>('Completing sign in...')
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

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
          
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError)
            setError('Authentication failed. Please try signing in again.')
            redirectTimeout = setTimeout(() => {
              router.push('/auth/login');
            }, 5000);
            return;
          }
          
          if (!data.session) {
            console.error('No session returned after code exchange')
            setError('Unable to establish a session. Please try signing in again.')
            redirectTimeout = setTimeout(() => {
              router.push('/auth/login');
            }, 5000);
            return;
          }
          
          console.log('Successfully exchanged code for session')
          
          // Verify the session was properly stored
          const { data: sessionCheck } = await supabase.auth.getSession()
          console.log('Session verification:', sessionCheck.session ? 'Session found' : 'No session found')
          
          if (sessionCheck.session) {
            handleUserSession(data.session.user.id)
          } else {
            console.error('Session verification failed - session not stored properly')
            setError('Session could not be established. Please try signing in again.')
            redirectTimeout = setTimeout(() => {
              router.push('/auth/login');
            }, 5000);
          }
        } catch (exchangeErr) {
          console.error('Unexpected error exchanging code:', exchangeErr)
          setError('An unexpected error occurred. Please try signing in again.')
          redirectTimeout = setTimeout(() => {
            router.push('/auth/login');
          }, 5000);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
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

  const handleManualLogin = () => {
    router.push('/auth/login');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      p: 2
    }}>
      {error ? (
        <>
          <Typography variant="h6" color="error" sx={{ textAlign: 'center', mb: 2 }}>
            {error}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', textAlign: 'center' }}>
            Redirecting you back to the login page in a few seconds...
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleManualLogin}
          >
            Return to Login
          </Button>
        </>
      ) : (
        <>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, textAlign: 'center' }}>
            {message}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}>
            Please wait while we complete your authentication...
          </Typography>
        </>
      )}
    </Box>
  )
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