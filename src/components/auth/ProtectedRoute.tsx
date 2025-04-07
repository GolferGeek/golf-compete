'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CircularProgress, Box } from '@mui/material'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { profile, isLoading, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || '/'

  useEffect(() => {
    console.log('ProtectedRoute state:', {
      isLoading,
      hasSession: !!session,
      hasProfile: !!profile,
      pathname,
      profileId: profile?.id
    })

    // If not loading and no session, redirect to login
    if (!isLoading && !session) {
      console.log('No session, redirecting to login')
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // If session exists but no profile, redirect to onboarding
    // Skip this check on the onboarding page itself
    if (!isLoading && session && !profile && !pathname.includes('/onboarding')) {
      console.log('Session exists but no profile, redirecting to onboarding')
      router.push('/onboarding')
      return
    }
  }, [session, isLoading, router, pathname, profile])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // If not loading and has session, render children
  if (!isLoading && session) {
    return <>{children}</>
  }

  // This should not be visible due to the redirect in useEffect
  return null
} 