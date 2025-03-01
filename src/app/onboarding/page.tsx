'use client'

import { useState, FormEvent, useEffect } from 'react'
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
import { createUserProfile } from '@/lib/supabase'
import { AuthError } from '@supabase/supabase-js'

const steps = ['Basic Information', 'Golf Details']

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [handicap, setHandicap] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
    
    if (!validateGolfDetails()) {
      return
    }
    
    if (!user) {
      setError('No user found. Please sign in again.')
      setTimeout(() => router.push('/auth/login'), 2000)
      return
    }
    
    setIsLoading(true)

    try {
      const profile = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        username,
        handicap: handicap ? parseFloat(handicap) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await createUserProfile(profile)
      
      if (error) {
        throw error
      }

      // Refresh the profile in the auth context
      await refreshProfile()
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error('Profile creation error:', error)
      setError(error instanceof AuthError ? error.message : 'Failed to create profile')
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
            Let's set up your profile to get started.
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
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
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
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
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
                  value={handicap}
                  onChange={(e) => setHandicap(e.target.value)}
                  disabled={isLoading}
                  helperText="Leave blank if you don&apos;t have a handicap yet"
                />
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isLoading}
                variant="outlined"
                sx={{ py: 1.5, px: 4 }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ py: 1.5, px: 4 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : activeStep === steps.length - 1 ? (
                  'Complete'
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