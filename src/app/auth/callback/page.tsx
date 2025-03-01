'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserProfile } from '@/lib/supabase'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting auth session:', sessionError)
          setError('Authentication failed. Please try again.')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }
        
        if (data?.session) {
          // Check if user has a profile
          const { data: profileData, error: profileError } = await getUserProfile(data.session.user.id)
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error checking user profile:', profileError)
            setError('Error checking user profile. Please try again.')
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }
          
          if (!profileData) {
            // User doesn't have a profile, redirect to onboarding
            router.push('/onboarding')
          } else {
            // User has a profile, redirect to dashboard
            router.push('/dashboard')
          }
        } else {
          // No session, redirect to login
          setError('No session found. Please try signing in again.')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred. Please try again.')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [router])

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
            Completing sign in...
          </Typography>
        </>
      )}
    </Box>
  )
} 