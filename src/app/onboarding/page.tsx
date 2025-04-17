'use client'

import { useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Paper,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import { updateUserProfile, fetchUserProfile } from '@/lib/apiClient/profile'

const steps = ['Basic Information', 'Golf Details']

export default function OnboardingPage() {
  const { user, session, loading, refreshProfile } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [handicap, setHandicap] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [redirectingToLogin, setRedirectingToLogin] = useState(false)
  const redirectTimer = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Safe redirect function to prevent loops
  const safeRedirect = useCallback((path: string) => {
    if (redirectingToLogin) return;
    
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
    }
    
    console.log(`Safe redirect to: ${path}`);
    setRedirectingToLogin(true);
    redirectTimer.current = setTimeout(() => {
      router.push(path);
    }, 500);
  }, [router, redirectingToLogin]);

  // Redirect to login if no user is found
  useEffect(() => {
    // Skip if auth is still loading or already redirecting
    if (loading || redirectingToLogin) return;
    
    // Clear any existing timeout
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
    }
    
    // If we are logged in, we should stay on this page
    if (session) {
      console.log('User is logged in, staying on onboarding page');
      return;
    }
    
    // Only redirect if we're sure there's no session
    if (!session && !user) {
      console.log('No user found in onboarding page, preparing to redirect to login');
      safeRedirect('/auth/login');
    }
    
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, [user, session, loading, safeRedirect, redirectingToLogin]);

  // Pre-fill user data from Google account if available
  useEffect(() => {
    if (user) {
      // Check if user has metadata from Google
      const metadata = user.user_metadata
      
      if (metadata) {
        // Set first name if available
        if (metadata.full_name) {
          const nameParts = metadata.full_name.split(' ')
          if (nameParts.length > 0) {
            setFirstName(nameParts[0] || '')
            
            // Set last name if available (everything after the first name)
            if (nameParts.length > 1) {
              setLastName(nameParts.slice(1).join(' '))
            }
          }
        } else {
          // Try individual name fields
          if (metadata.given_name) {
            setFirstName(metadata.given_name)
          }
          if (metadata.family_name) {
            setLastName(metadata.family_name)
          }
        }
        
        // Set username from email if available
        if (user.email) {
          // Use the part before @ as a suggested username
          const emailUsername = user.email.split('@')[0]
          // Remove any non-alphanumeric characters and make it lowercase
          const cleanUsername = emailUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
          setUsername(cleanUsername)
        }
      }
    }
  }, [user])

  const validateBasicInfo = () => {
    if (!firstName || !lastName || !username) {
      setError('All fields are required')
      return false
    }
    return true
  }

  const validateGolfDetails = () => {
    if (handicap && isNaN(Number(handicap))) {
      setError('Handicap must be a number')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (activeStep === 0 && !validateBasicInfo()) {
      return
    }
    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // If not on the last step, just go to next step
    if (activeStep < steps.length - 1) {
      handleNext()
      return
    }
    
    setError(null)
    console.log('Starting profile creation process...')
    
    if (!validateGolfDetails()) {
      return
    }
    
    if (!user) {
      console.error('No user found in onboarding')
      setError('No user found. Please sign in again.')
      setTimeout(() => router.push('/auth/login'), 2000)
      return
    }
    
    console.log('User found, proceeding with profile creation:', user.id)
    setIsLoading(true)

    try {
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        username,
        handicap: handicap ? parseFloat(handicap) : undefined
      }

      console.log('Attempting to create profile with data:', profileData)
      
      // First check if profile already exists using API
      // The API will get the user from the session, so no need to specify user ID
      try {
        // The API call fetchUserProfile() is expected to throw if the profile doesn't exist
        await fetchUserProfile()
        console.log('User already has a profile, redirecting to dashboard')
        router.push('/dashboard')
        return
      } catch (checkError) {
        // Expected error if profile doesn't exist - continue with creation
        console.log('Profile not found, proceeding with creation', checkError)
      }
      
      // Add a timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile creation timed out after 10 seconds')), 10000)
      })
      
      // Use the API to create the profile
      // This creates a new profile for the current authenticated user
      try {
        // Race the profile creation against the timeout
        await Promise.race([
          updateUserProfile(profileData),
          timeoutPromise
        ])
        
        console.log('Profile created successfully, refreshing profile data')
        // Refresh the profile in the auth context
        await refreshProfile()
        
        console.log('Redirecting to dashboard')
        // Redirect to dashboard
        router.push('/dashboard')
      } catch (createError: any) {
        console.error('Error during profile creation:', createError)
        
        // If the error indicates a profile already exists (could be a race condition)
        if (createError.message && 
            (createError.message.includes('duplicate key value') || 
             createError.status === 409)) {
          console.log('Profile already exists (conflict error), refreshing and redirecting')
          try {
            await refreshProfile()
          } catch (refreshError) {
            console.error('Failed to refresh profile, but continuing to dashboard:', refreshError)
          }
          router.push('/dashboard')
          return
        }
        
        // For username uniqueness violations, show specific error
        if (createError.message && 
            (createError.message.includes('unique constraint') || 
             createError.status === 400)) {
          throw new Error('This username is already taken. Please choose another one.')
        }
        
        // Otherwise rethrow the error
        throw createError
      }
    } catch (error: unknown) {
      console.error('Profile creation error:', error)
      
      // If it's a timeout error, provide a more helpful message
      if (error instanceof Error && error.message.includes('timed out')) {
        setError('The operation is taking too long. You may already have a profile - try going to the dashboard.')
        // Add a button or link to go to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 5000)
      } else {
        setError(error instanceof Error ? error.message : 'Failed to create profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Welcome to Golf Compete
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 4 }}>
            Let&apos;s set up your profile to get started.
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {activeStep === 0 ? (
              // Step 1: Basic Information
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  helperText="Choose a unique username for your profile"
                />
              </>
            ) : (
              // Step 2: Golf Details
              <>
                <TextField
                  margin="normal"
                  fullWidth
                  id="handicap"
                  label="Handicap (optional)"
                  name="handicap"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  helperText="Enter your current handicap if you have one"
                />
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isLoading}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  'Complete Setup'
                ) : (
                  'Next'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
} 