'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material'
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase'
import { AuthError } from '@supabase/supabase-js'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error } = await signInWithEmail(email, password)
      
      if (error) {
        throw error
      }

      if (data.user) {
        router.push(redirectPath)
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      setError(error instanceof AuthError ? error.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setIsGoogleLoading(true)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        throw error
      }
      
      // The redirect will happen automatically
    } catch (error: unknown) {
      console.error('Google login error:', error)
      setError(error instanceof AuthError ? error.message : 'Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            sx={{ py: 1.5, mb: 2 }}
          >
            {isGoogleLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Box component="img" src="/google-logo.svg" alt="Google" sx={{ width: 20, height: 20, mr: 1 }} />
                Sign in with Google
              </>
            )}
          </Button>
          
          <Divider sx={{ my: 2 }}>or</Divider>
          
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Link href="/auth/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Forgot password?
                </Typography>
              </Link>
              <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Do not have an account? Sign Up
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <LoginForm />
    </Suspense>
  )
} 