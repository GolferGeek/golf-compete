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
import { AuthError } from '@supabase/supabase-js'
import { register, signInWithGoogle } from '@/lib/apiClient/auth'

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
      // Use the API client register function
      const response = await register({
        email,
        password,
        // Can add optional fields here if needed
        // first_name: firstName,
        // last_name: lastName,
        // username: username,
      });
      
      setSuccess('Account created successfully! Please check your email for confirmation.');
      
      // Wait a moment before redirecting to show success message
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Signup error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to sign up. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      console.log('Initiating Google sign-up');
      
      // Use the API client which handles the redirect
      await signInWithGoogle();
      
      // The page will be redirected by the signInWithGoogle function
      // If we're still here after a timeout, show an error
      setTimeout(() => {
        if (document.visibilityState !== 'hidden') {
          setError('Failed to redirect to Google. Please try again.');
          setIsGoogleLoading(false);
        }
      }, 5000);
    } catch (error: unknown) {
      console.error('Google signup error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to sign up with Google. Please try again.');
      }
      setIsGoogleLoading(false);
    }
  };

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