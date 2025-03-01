'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material'
import { resetPassword } from '@/lib/supabase'
import { AuthError } from '@supabase/supabase-js'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!email) {
      setError('Email is required')
      return
    }
    
    setIsLoading(true)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        throw error
      }

      setSuccess('Password reset instructions have been sent to your email')
      setEmail('')
    } catch (error: unknown) {
      console.error('Password reset error:', error)
      setError(error instanceof AuthError ? error.message : 'Failed to send reset instructions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Reset Password
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Enter your email address and we will send you instructions to reset your password.
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
          
          <Box component="form" onSubmit={handleResetPassword} noValidate>
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Back to Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
} 