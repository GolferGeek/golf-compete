'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, session, isLoading: authLoading } = useAuth()
  const redirectPath = searchParams?.get('redirect') || '/dashboard'

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      // Prevent recursive checks
      if (hasCheckedSession) {
        return
      }

      try {
        console.log('Checking for existing session...')
        const supabase = getSupabaseBrowserClient()
        
        // Clear any stale auth data first
        if (typeof window !== 'undefined') {
          const hasStaleToken = localStorage.getItem('sb-refresh-token') || 
                               localStorage.getItem('sb-access-token') ||
                               localStorage.getItem('supabase.auth.token')
          
          if (hasStaleToken) {
            console.log('Found stale auth tokens, clearing them...')
            await supabase.auth.signOut()
            
            // Clear local storage manually as well
            localStorage.removeItem('supabase.auth.token')
            localStorage.removeItem('sb-refresh-token')
            localStorage.removeItem('sb-access-token')
            localStorage.removeItem('sb-auth-token')
          }
        }
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error checking session:', error)
          setCheckingSession(false)
          setHasCheckedSession(true)
          return
        }
        
        if (currentSession?.user) {
          console.log('Active session found, checking for profile...')
          // Wait for profile to be loaded
          await new Promise(resolve => setTimeout(resolve, 500))
          
          if (profile) {
            console.log('Profile found, redirecting to:', redirectPath)
            router.replace(redirectPath)
          } else {
            console.log('No profile found, redirecting to onboarding')
            router.replace('/onboarding')
          }
          return
        }
        
        console.log('No active session found, showing login form')
        setCheckingSession(false)
        setHasCheckedSession(true)
      } catch (err) {
        console.error('Unexpected error checking session:', err)
        setCheckingSession(false)
        setHasCheckedSession(true)
      }
    }

    // Only check session if:
    // 1. We haven't checked before
    // 2. We're not already loading auth state
    // 3. We don't already have a session and profile
    if (!hasCheckedSession && !authLoading) {
      if (session) {
        console.log('Session already in context, checking profile...')
        if (profile) {
          console.log('Profile found, redirecting to:', redirectPath)
          router.replace(redirectPath)
        } else {
          console.log('No profile found, redirecting to onboarding')
          router.replace('/onboarding')
        }
      } else {
        checkSession()
      }
    }
  }, [router, session, profile, redirectPath, hasCheckedSession, authLoading])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      console.log('Attempting email login...')
      const supabase = getSupabaseBrowserClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Email login error:', error)
        setError('Failed to sign in with email. Please check your credentials and try again.')
        setLoading(false)
        return
      }
      
      if (data.session) {
        console.log('Email login successful, waiting for profile...')
        // Wait for profile to be loaded
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (profile) {
          console.log('Profile found, redirecting to:', redirectPath)
          router.push(redirectPath)
        } else {
          console.log('No profile found, redirecting to onboarding')
          router.push('/onboarding')
        }
      } else {
        setError('No session established after login. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Unexpected error during email login:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Initiating Google login...')
      const supabase = getSupabaseBrowserClient()
      
      // Clear any existing session first
      await supabase.auth.signOut()
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        console.error('Google login error:', error)
        setError('Failed to sign in with Google. Please try again.')
        setLoading(false)
        return
      }
      
      if (!data.url) {
        console.error('No OAuth URL returned')
        setError('Failed to initiate Google sign in. Please try again.')
        setLoading(false)
        return
      }
      
      // Redirect to the OAuth URL
      window.location.href = data.url
    } catch (err) {
      console.error('Unexpected error during Google login:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <LoginLoading />;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome Back
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleEmailLogin}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={<EmailIcon />}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </Button>
        </form>
        
        <Divider sx={{ my: 3 }}>or</Divider>
        
        <Button
          fullWidth
          onClick={handleGoogleLogin}
          variant="outlined"
          disabled={loading}
          startIcon={<GoogleIcon />}
        >
          Sign in with Google
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <MuiLink component={Link} href="/auth/signup">
              Sign up
            </MuiLink>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <MuiLink component={Link} href="/auth/forgot-password">
              Forgot your password?
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

// Main login page component with Suspense boundary
export default function Login() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}