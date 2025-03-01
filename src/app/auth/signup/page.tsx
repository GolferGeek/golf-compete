'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
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
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase'
import { AuthError } from '@supabase/supabase-js'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    
    return true
  }

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!validateForm()) return
    
    setIsLoading(true)

    try {
      const { data, error } = await signUpWithEmail(email, password)
      
      if (error) {
        throw error
      }

      if (data.user) {
        setSuccess('Account created successfully! Redirecting to onboarding...')
        // Wait a moment before redirecting to show success message
        setTimeout(() => {
          router.push('/onboarding')
        }, 2000)
      }
    } catch (error: unknown) {
      console.error('Signup error:', error)
      setError(error instanceof AuthError ? error.message : 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError(null)
    setSuccess(null)
    setIsGoogleLoading(true)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        throw error
      }
      
      // The redirect will happen automatically
    } catch (error: unknown) {
      console.error('Google signup error:', error)
      setError(error instanceof AuthError ? error.message : 'Failed to sign up with Google')
      setIsGoogleLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            sx={{ py: 1.5, mb: 2 }}
          >
            {isGoogleLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Box component="img" src="/google-logo.svg" alt="Google" sx={{ width: 20, height: 20, mr: 1 }} />
                Sign up with Google
              </>
            )}
          </Button>
          
          <Divider sx={{ my: 2 }}>or</Divider>
          
          <Box component="form" onSubmit={handleEmailSignUp} noValidate>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
} 