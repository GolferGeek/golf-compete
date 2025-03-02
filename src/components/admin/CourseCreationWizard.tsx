"use client";

import React from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Paper,
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import CourseInfoStep from './wizard/CourseInfoStep';
import TeeSetStep from './wizard/TeeSetStep';
import ScorecardStep from './wizard/ScorecardStep';
import { CourseCreationProvider, useCourseCreationContext } from '@/contexts/CourseCreationContext';
import { getBrowserClient } from '@/lib/supabase-browser';

const steps = ['Course Information', 'Tee Sets', 'Scorecard Details'];

function CourseCreationWizardContent() {
  const { 
    currentStep, 
    nextStep, 
    prevStep, 
    submitCourse, 
    isSubmitting, 
    submitError, 
    user, 
    profile 
  } = useCourseCreationContext();
  
  const handleReset = () => {
    // Reload the page to reset everything
    window.location.reload();
  };
  
  const handleSubmit = async () => {
    try {
      console.log('Proceeding with course submission using admin privileges');
      await submitCourse();
    } catch (error) {
      console.error('Error in submit handler:', error);
      // Error is already handled in the context
    }
  };
  
  // Add a more comprehensive auth check function
  const checkAuthState = async () => {
    try {
      // Get the current Supabase client
      const supabase = getBrowserClient();
      
      // Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('=== WIZARD AUTH DEBUG ===');
      console.log('Supabase Session:', session ? 'Active' : 'None');
      if (session) {
        console.log('User ID:', session.user.id);
        console.log('User Email:', session.user.email);
        console.log('Session Expires:', new Date(session.expires_at * 1000).toLocaleString());
        
        // Try to refresh the session
        console.log('Attempting to refresh session...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh error:', refreshError);
        } else {
          console.log('Session refreshed successfully');
          console.log('New expiry:', new Date(refreshData.session?.expires_at * 1000).toLocaleString());
        }
      }
      if (sessionError) {
        console.error('Session Error:', sessionError);
      }
      
      // Check AuthContext state
      console.log('AuthContext State:');
      console.log('User:', user ? 'Present' : 'None');
      console.log('Profile:', profile ? 'Present' : 'None');
      if (profile) {
        console.log('Is Admin:', profile.is_admin ? 'Yes' : 'No');
      }
      
      console.log('======================');
    } catch (error) {
      console.error('Error checking auth state:', error);
    }
  };
  
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <CourseInfoStep />;
      case 1:
        return <TeeSetStep />;
      case 2:
        return <ScorecardStep />;
      case 3:
        return (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="h6" gutterBottom>
              Course Created Successfully!
            </Typography>
            <Typography variant="body1">
              Your course has been added to the database.
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create New Course
        </Typography>
        
        <Stepper activeStep={currentStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        {currentStep === steps.length ? (
          <Box>
            {getStepContent(currentStep)}
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleReset}>Create Another Course</Button>
            </Box>
          </Box>
        ) : (
          <Box>
            {getStepContent(currentStep)}
            
            {currentStep !== 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                <Button
                  color="inherit"
                  disabled={isSubmitting}
                  onClick={prevStep}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                
                {currentStep === steps.length - 1 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Course'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={checkAuthState}
                      disabled={isSubmitting}
                    >
                      Check Auth State
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={nextStep}
                  >
                    Next
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default function CourseCreationWizard() {
  return (
    <CourseCreationProvider>
      <CourseCreationWizardContent />
    </CourseCreationProvider>
  );
}
