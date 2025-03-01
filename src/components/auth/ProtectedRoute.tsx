'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CircularProgress, Box } from '@mui/material'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // If user exists but no profile, redirect to onboarding
    // Skip this check on the onboarding page itself
    if (!isLoading && user && !profile && !pathname.includes('/onboarding')) {
      router.push('/onboarding')
      return
    }
  }, [user, isLoading, router, pathname, profile])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // If not loading and has user, render children
  if (!isLoading && user) {
    return <>{children}</>
  }

  // This should not be visible due to the redirect in useEffect
  return null
} 