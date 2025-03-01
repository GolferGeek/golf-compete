"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  Box, 
  Typography, 
  Divider,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TeeBoxesAndHolesManager from './TeeBoxesAndHolesManager';
import { useAuth } from '@/contexts/AuthContext';

interface CourseFormProps {
  courseId?: string; // Optional for edit mode
}

interface CourseFormData {
  name: string;
  location: string;
  holes: number;
  par: number;
  rating: number;
  slope: number;
  amenities: string;
  website: string;
  phoneNumber: string;
}

export default function CourseForm({ courseId }: CourseFormProps) {
  const router = useRouter();
  const isEditMode = !!courseId;
  const { session } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    location: '',
    holes: 18,
    par: 72,
    rating: 72.0,
    slope: 113,
    amenities: '',
    website: '',
    phoneNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to fetch course data');
        setError('You must be logged in to view course data. Please log in and try again.');
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        // Handle authentication errors
        if (error.code === 'PGRST301' || error.code === '401') {
          setError('Your session has expired. Please log in again.');
          router.push('/auth/login?redirect=/admin/courses');
        } else {
          setError('Failed to load course data. Please try again.');
        }
        throw error;
      }
      
      if (data) {
        setFormData({
          name: data.name || '',
          location: data.location || '',
          holes: data.holes || 18,
          par: data.par || 72,
          rating: data.rating || 72.0,
          slope: data.slope || 113,
          amenities: data.amenities ? 
            (typeof data.amenities === 'string' ? 
              JSON.parse(data.amenities).join(', ') : 
              Array.isArray(data.amenities) ? 
                data.amenities.join(', ') : 
                data.amenities) : 
            '',
          website: data.website || '',
          phoneNumber: data.phone_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      // Error is already set above
    } finally {
      setLoading(false);
    }
  }, [courseId, session, router]);
  
  useEffect(() => {
    if (isEditMode) {
      fetchCourseData();
    }
  }, [isEditMode, fetchCourseData]);
  
  // Handle text field changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle select field changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: Number(value)
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to save course data');
        setError('You must be logged in to save course data. Please log in and try again.');
        setLoading(false);
        return;
      }
      
      // Validate form data
      if (!formData.name || !formData.location) {
        setError('Name and location are required fields');
        return;
      }
      
      // Format data for submission
      const courseData = {
        name: formData.name,
        location: formData.location,
        holes: Number(formData.holes),
        par: Number(formData.par),
        rating: Number(formData.rating),
        slope: Number(formData.slope),
        amenities: formData.amenities ? JSON.stringify(formData.amenities.split(',').map(item => item.trim()).filter(item => item !== '')) : null,
        website: formData.website || null,
        phone_number: formData.phoneNumber || null,
      };
      
      let result;
      let savedCourseId = courseId;
      
      if (isEditMode) {
        // Update existing course
        result = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId);
      } else {
        // Insert new course
        result = await supabase
          .from('courses')
          .insert(courseData)
          .select();
          
        if (result.data && result.data.length > 0) {
          savedCourseId = result.data[0].id;
        }
      }
      
      if (result.error) {
        // Handle authentication errors
        if (result.error.code === 'PGRST301' || result.error.code === '401') {
          setError('Your session has expired. Please log in again.');
          router.push('/auth/login?redirect=/admin/courses');
        } else {
          setError('Failed to save course. Please try again.');
        }
        throw result.error;
      }
      
      setSuccess(true);
      
      if (activeStep === 0) {
        // Move to the next step if we're on the first step
        setActiveStep(1);
      } else {
        // Redirect after successful submission if we're on the second step
        setTimeout(() => {
          router.push('/admin/courses');
        }, 1500);
      }
      
    } catch (err) {
      console.error('Error saving course:', err);
      // Error is already set above
    } finally {
      setLoading(false);
    }
  };
  
  const steps = ['Basic Course Information', 'Tee Boxes & Holes'];
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  return (
    <Box>
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Course {isEditMode ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {activeStep === 0 ? (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Basic Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Course Name"
                name="name"
                value={formData.name}
                onChange={handleTextChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleTextChange}
                disabled={loading}
                helperText="City, State or full address"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="holes-label">Holes</InputLabel>
                <Select
                  labelId="holes-label"
                  name="holes"
                  value={formData.holes.toString()}
                  label="Holes"
                  onChange={handleSelectChange}
                  disabled={loading}
                >
                  <MenuItem value="9">9</MenuItem>
                  <MenuItem value="18">18</MenuItem>
                  <MenuItem value="27">27</MenuItem>
                  <MenuItem value="36">36</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Par"
                name="par"
                type="number"
                value={formData.par}
                onChange={handleTextChange}
                disabled={loading}
                InputProps={{ inputProps: { min: 27, max: 100 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Course Rating"
                name="rating"
                type="number"
                value={formData.rating}
                onChange={handleTextChange}
                disabled={loading}
                InputProps={{ inputProps: { min: 55, max: 90, step: 0.1 } }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Slope Rating"
                name="slope"
                type="number"
                value={formData.slope}
                onChange={handleTextChange}
                disabled={loading}
                InputProps={{ inputProps: { min: 55, max: 155 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>Additional Information</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amenities"
                name="amenities"
                value={formData.amenities}
                onChange={handleTextChange}
                disabled={loading}
                helperText="Enter amenities separated by commas (e.g., Driving Range, Pro Shop, Restaurant)"
                placeholder="Driving Range, Pro Shop, Restaurant, Cart Rental"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleTextChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleTextChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/courses')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Box>
                  {isEditMode && (
                    <Button
                      variant="outlined"
                      onClick={handleNext}
                      sx={{ mr: 1 }}
                      disabled={loading}
                    >
                      Skip to Tee Boxes & Holes
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Save and Continue'}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          {courseId ? (
            <TeeBoxesAndHolesManager 
              courseId={courseId} 
              courseName={formData.name}
              numberOfHoles={formData.holes}
            />
          ) : (
            <Alert severity="info">
              Please save the course information first before adding tee boxes and holes.
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={loading}
            >
              Back to Course Details
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/admin/courses')}
              disabled={loading}
            >
              Finish
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
} 