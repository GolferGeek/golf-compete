'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CircularProgress, Box } from '@mui/material'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { profile, loading, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || '/'
  const isRedirecting = useRef(false)
  const lastRedirectTime = useRef<number>(0)
  const lastPathRef = useRef<string>(pathname)
  const sessionRef = useRef(session)
  const profileRef = useRef(profile)
  
  // Special handling for different page types
  const isHomePage = pathname === '/'
  const isProfilePage = pathname === '/profile' || pathname.startsWith('/profile/')
  const isOnboardingPage = pathname === '/onboarding' || pathname.startsWith('/onboarding/')
  const isAuthPage = pathname.includes('/auth/')

  // Home page is never protected
  if (isHomePage) {
    return <>{children}</>;
  }

  // Simple throttle for redirects - only allow one redirect every 2 seconds
  const shouldThrottleRedirect = () => {
    const now = Date.now()
    const timeSinceLastRedirect = now - lastRedirectTime.current
    return timeSinceLastRedirect < 2000 // 2 seconds
  }

  // Update refs when session or profile changes
  useEffect(() => {
    if (!loading) {
      sessionRef.current = session
    }
  }, [session, loading])

  useEffect(() => {
    if (!loading) {
      profileRef.current = profile
    }
  }, [profile, loading])

  // Handle redirects based on auth state
  useEffect(() => {
    // Skip for home page - it should always be accessible
    if (isHomePage) return;
    
    // Skip if loading, already redirecting, or we should throttle
    if (loading || isRedirecting.current || shouldThrottleRedirect()) return
    
    // Skip if the path hasn't changed (prevents recursive redirects on the same page)
    if (pathname === lastPathRef.current && isRedirecting.current) return
    
    // Update last path ref
    lastPathRef.current = pathname
    
    console.log('ProtectedRoute check:', {
      hasSession: !!session,
      hasProfile: !!profile,
      isLoading: loading,
      isProfilePage,
      isOnboardingPage,
      isAuthPage,
      isHomePage,
      pathname
    })

    // If no session and not on an auth page, redirect to login
    if (!session && !isAuthPage) {
      console.log('No active session, redirecting to login')
      isRedirecting.current = true
      lastRedirectTime.current = Date.now()
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    // Only check for profile if we have a session
    // Skip this check on onboarding and auth pages
    if (session && !profile && !isOnboardingPage && !isAuthPage) {
      console.log('Session exists but no profile, redirecting to onboarding')
      isRedirecting.current = true
      lastRedirectTime.current = Date.now()
      router.push('/onboarding')
      return
    }
    
    // Reset the redirecting flag if we reach this point
    isRedirecting.current = false
  }, [session, profile, loading, router, pathname, isProfilePage, isOnboardingPage, isAuthPage, isHomePage])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // If no session and not on an auth page, show loading (should redirect soon)
  if (!session && !isAuthPage) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // If we have a session
  if (session) {
    // Allow access to onboarding without a profile
    if (isOnboardingPage) {
      return <>{children}</>
    }
    
    // For other pages, require a profile (except auth pages)
    if (profile || isAuthPage) {
      return <>{children}</>
    }
    
    // Session but no profile (should redirect to onboarding)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Auth pages are always accessible without a session
  if (isAuthPage) {
    return <>{children}</>
  }

  // This should rarely be visible due to the redirects
  return null
} 