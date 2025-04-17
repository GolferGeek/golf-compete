'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material'

// Create a client component that uses the search params
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('Processing authentication...')
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | null = null;

    const handleAuthCallback = async () => {
      try {
        if (!searchParams) {
          console.error('No search params available')
          setError('Authentication failed. Please try signing in again.')
          redirectTimeout = setTimeout(() => {
            router.push('/auth/login');
          }, 5000);
          return;
        }

        // Log all URL parameters for debugging
        console.log('Auth callback URL parameters:');
        searchParams.forEach((value, key) => {
          console.log(`${key}: ${value}`);
        });
        
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const error_description = searchParams.get('error_description')
        let redirectTo = searchParams.get('redirect') || '/dashboard'
        
        // Clean the redirectTo path
        if (redirectTo && !redirectTo.startsWith('/')) {
          redirectTo = '/' + redirectTo;
        }
        
        console.log(`Will redirect to: ${redirectTo} after successful auth`);
        
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
        
        const supabase = getSupabaseBrowserClient()
        console.log('Supabase client initialized:', !!supabase);
        
        // Check initial auth state
        const initialSession = await supabase.auth.getSession();
        console.log('Initial session check:', initialSession.data.session ? 'Session exists' : 'No session');
        
        // First try with automatic code exchange
        console.log('Attempting automatic code exchange...');
        
        // Wait a moment to ensure the auth state can update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we have a session after the automatic exchange
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session after automatic exchange:', sessionError);
          setDebugInfo(`Session error: ${sessionError.message}`);
          
          // Try manual exchange as fallback
          console.log('Trying manual code exchange...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError);
            setError('Authentication failed. Please try signing in again.');
            setDebugInfo(`Exchange error: ${exchangeError.message}`);
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
          
          console.log('Session established via manual exchange, userId:', data.session.user.id);
          setMessage('Authentication successful! Redirecting...');
          
          // Refresh the page once to ensure auth state is updated across the app
          redirectTimeout = setTimeout(() => {
            console.log('Redirecting to:', redirectTo);
            router.push(redirectTo);
          }, 1500);
          return;
        }
        
        if (!session) {
          console.log('No session found after automatic exchange, trying manual exchange...');
          
          try {
            // Try manual exchange as fallback
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError);
              setError('Authentication failed. Please try signing in again.');
              setDebugInfo(`Exchange error: ${exchangeError.message}`);
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
            
            console.log('Session established successfully via manual exchange, userId:', data.session.user.id);
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect after successful authentication
            redirectTimeout = setTimeout(() => {
              console.log('Redirecting to:', redirectTo);
              router.push(redirectTo);
            }, 1500);
          } catch (manualExchangeError) {
            console.error('Error during manual exchange:', manualExchangeError);
            setError('Authentication process failed. Please try signing in again.');
            setDebugInfo(manualExchangeError instanceof Error ? manualExchangeError.message : 'Unknown error');
            redirectTimeout = setTimeout(() => {
              router.push('/auth/login');
            }, 5000);
          }
        } else {
          console.log('Session found after automatic exchange, userId:', session.user.id);
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect after successful authentication
          redirectTimeout = setTimeout(() => {
            console.log('Redirecting to:', redirectTo);
            router.push(redirectTo);
          }, 1500);
        }
      } catch (error) {
        console.error('Top level error in auth callback:', error)
        setError('An unexpected error occurred. Please try signing in again.')
        setDebugInfo(error instanceof Error ? error.message : 'Unknown error');
        redirectTimeout = setTimeout(() => {
          router.push('/auth/login');
        }, 5000);
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
        {debugInfo && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Debug info: {debugInfo}
          </Typography>
        )}
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
      {debugInfo && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Debug info: {debugInfo}
        </Typography>
      )}
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