'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase'
import { getBrowserClient } from '@/lib/supabase-browser'
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
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for existing session...')
        const supabase = getBrowserClient()
        
        if (!supabase) {
          console.error('Failed to initialize Supabase client')
          setCheckingSession(false)
          return
        }
        
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
        
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error checking session:', error)
          setCheckingSession(false)
          return
        }
        
        if (data?.session) {
          console.log('Active session found, redirecting to dashboard')
          router.push('/dashboard')
          return
        }
        
        console.log('No active session found, showing login form 2')
        setCheckingSession(false)
      } catch (err) {
        console.error('Unexpected error checking session:', err)
        setCheckingSession(false)
      }
    }

    // Only check session if we don't already have a user in context
    if (user) {
      console.log('User already in context, redirecting to dashboard')
      router.push('/dashboard')
    } else {
      checkSession()
    }
  }, [router, user])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      console.log('Attempting email login...')
      const supabase = getBrowserClient()
      
      if (!supabase) {
        console.error('Failed to initialize Supabase client')
        setError('Authentication service unavailable. Please try again later.')
        setLoading(false)
        return
      }
      
      const { error } = await signInWithEmail(email, password, supabase as any)
      
      if (error) {
        console.error('Email login error:', error)
        setError('Failed to sign in with email. Please check your credentials and try again.')
        setLoading(false)
        return
      }
      
      console.log('Email login successful, redirecting...')
      router.push('/dashboard')
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
      const supabase = getBrowserClient()
      
      if (!supabase) {
        console.error('Failed to initialize Supabase client')
        setError('Authentication service unavailable. Please try again later.')
        setLoading(false)
        return
      }
      
      // Clear any existing session first
      await supabase.auth.signOut()
      
      const { error } = await signInWithGoogle(supabase as any)
      
      if (error) {
        console.error('Google login error:', error)
        // Use a generic error message to avoid type issues
        setError('Failed to sign in with Google. Please try again.')
        setLoading(false)
      }
      
      // Note: We don't redirect here as the OAuth flow will handle that
    } catch (err) {
      console.error('Unexpected error during Google login:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  if (checkingSession) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Checking authentication status...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Welcome to Golf Compete
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          Sign in to continue to your account
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={clearError}
          >
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ 
            py: 1.5, 
            mb: 2,
            bgcolor: '#4285F4',
            '&:hover': {
              bgcolor: '#3367D6',
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Google'}
        </Button>
        
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
            disabled={loading}
            startIcon={<EmailIcon />}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Email'}
          </Button>
        </Box>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <MuiLink 
              href="/auth/signup" 
              sx={{ 
                fontWeight: 'medium',
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                }
              }}
            >
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}