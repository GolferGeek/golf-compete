'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import EmailIcon from '@mui/icons-material/Email'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { login, getSession, signInWithGoogle } from '@/lib/apiClient/auth'

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    </Container>
  );
}

// Separate the login form into its own component
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)
  const redirectTimer = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, session, loading: authLoading, refreshProfile } = useAuth()
  const redirectPath = searchParams?.get('redirect') || '/dashboard'
  const [redirectingToLogin, setRedirectingToLogin] = useState(false)
  const redirectDebounce = useRef<NodeJS.Timeout | null>(null)

  const safeRedirect = (path: string) => {
    if (redirectingToLogin) return;

    if (redirectDebounce.current) {
      clearTimeout(redirectDebounce.current);
    }

    setRedirectingToLogin(true);
    redirectDebounce.current = setTimeout(() => {
      console.log(`Safe redirect to: ${path}`);
      router.replace(path);
    }, 300);
  };

  useEffect(() => {
    if (hasCheckedSession || redirectingToLogin || authLoading) {
      return;
    }

    const checkSession = async () => {
      try {
        console.log('Checking for existing session...');
        setHasCheckedSession(true);
        
        if (session) {
          console.log('Session detected in context');
          if (profile) {
            console.log('Profile found, redirecting to:', redirectPath);
            safeRedirect(redirectPath);
          } else {
            console.log('No profile found, redirecting to onboarding');
            safeRedirect('/onboarding');
          }
          return;
        }
        
        try {
          const sessionData = await getSession();
          
          if (sessionData?.session?.user) {
            console.log('Session detected from API');
            await refreshProfile();
            
            if (profile) {
              console.log('Profile found after refresh, redirecting to:', redirectPath);
              safeRedirect(redirectPath);
            } else {
              console.log('No profile found after refresh, redirecting to onboarding');
              safeRedirect('/onboarding');
            }
            return;
          }
        } catch (err) {
          console.error('Error checking session:', err);
        }
        
        console.log('No session found, showing login form');
        setCheckingSession(false);
      } catch (err) {
        console.error('Unexpected error in session check:', err);
        setCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      if (redirectDebounce.current) {
        clearTimeout(redirectDebounce.current);
      }
    };
  }, [session, profile, redirectPath, hasCheckedSession, router, refreshProfile, authLoading, redirectingToLogin]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      console.log('Attempting email login...')
      
      // Use API client for login
      await login({
        email,
        password
      })
      
      console.log('Email login successful, waiting for profile...')
      // Wait for profile to be loaded
      await refreshProfile()
      
      if (profile) {
        console.log('Profile found, redirecting to:', redirectPath)
        router.push(redirectPath)
      } else {
        console.log('No profile found, redirecting to onboarding')
        router.push('/onboarding')
      }
    } catch (err) {
      console.error('Unexpected error during email login:', err)
      setError('Failed to sign in with email. Please check your credentials and try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Initiating Google login...')
      
      // Use the API client which handles the redirect
      await signInWithGoogle();
      
      // Note: The function above will redirect the browser
      // This code likely won't be reached unless there's an error
    } catch (err) {
      console.error('Unexpected error initiating Google login:', err)
      setError('Failed to initiate Google login. Please try again.')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <LoginLoading />
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Welcome to Golf Compete
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 4 }}>
            Please sign in to continue
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Continue with Google'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          <Box component="form" onSubmit={handleEmailLogin} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              startIcon={<EmailIcon />}
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In with Email'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Link href="/auth/signup" passHref legacyBehavior>
                <MuiLink variant="body2">
                  {"Don't have an account? Sign Up"}
                </MuiLink>
              </Link>
              <Link href="/auth/forgot-password" passHref legacyBehavior>
                <MuiLink variant="body2">
                  Forgot password?
                </MuiLink>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}