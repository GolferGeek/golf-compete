'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, getUserProfile } from '@/lib/supabase'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('Completing sign in...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have a code in the URL
        const code = searchParams.get('code')
        
        if (!code) {
          console.error('No code found in URL')
          setError('Authentication failed: No code found in URL. Please try again.')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }
        
        setMessage('Processing authentication...')
        
        // Get the session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting auth session:', sessionError)
          
          if (sessionError.message.includes('Invalid Refresh Token')) {
            // Try to exchange the code for a session
            setMessage('Exchanging authentication code...')
            
            try {
              // This will complete the OAuth flow by exchanging the code for a session
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
              
              if (exchangeError) {
                console.error('Error exchanging code for session:', exchangeError)
                setError('Authentication failed: Could not complete the sign-in process. Please try again.')
                setTimeout(() => router.push('/auth/login'), 3000)
                return
              }
              
              // Try to get the session again after exchange
              const { data: newData, error: newSessionError } = await supabase.auth.getSession()
              
              if (newSessionError || !newData.session) {
                console.error('Error getting session after exchange:', newSessionError)
                setError('Authentication failed: Session could not be established. Please try again.')
                setTimeout(() => router.push('/auth/login'), 3000)
                return
              }
              
              // Continue with the new session
              handleUserSession(newData.session.user.id)
            } catch (exchangeErr) {
              console.error('Unexpected error exchanging code:', exchangeErr)
              setError('An unexpected error occurred during authentication. Please try again.')
              setTimeout(() => router.push('/auth/login'), 3000)
            }
          } else {
            setError(`Authentication failed: ${sessionError.message}. Please try again.`)
            setTimeout(() => router.push('/auth/login'), 3000)
          }
          return
        }
        
        if (data?.session) {
          handleUserSession(data.session.user.id)
        } else {
          // No session, redirect to login
          console.error('No session found after OAuth callback')
          setError('No session found. Please try signing in again.')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred. Please try again.')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }
    
    const handleUserSession = async (userId: string) => {
      try {
        setMessage('Checking user profile...')
        
        // Check if user has a profile
        const { data: profileData, error: profileError } = await getUserProfile(userId)
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking user profile:', profileError)
          setError('Error checking user profile. Please try again.')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }
        
        if (!profileData) {
          // User doesn't have a profile, redirect to onboarding
          setMessage('Redirecting to complete your profile...')
          router.push('/onboarding')
        } else {
          // User has a profile, redirect to dashboard
          setMessage('Sign in successful! Redirecting...')
          router.push('/dashboard')
        }
      } catch (profileErr) {
        console.error('Error handling user session:', profileErr)
        setError('Error processing your profile. Please try again.')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

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
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {message}
          </Typography>
        </>
      )}
    </Box>
  )
} 