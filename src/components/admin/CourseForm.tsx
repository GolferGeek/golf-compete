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
  Paper,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
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
  isActive: boolean;
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
    phoneNumber: '',
    isActive: true
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
      
      // Make sure courseId is defined before using it
      if (!courseId) {
        console.error('No courseId provided for fetching course data');
        setError('Course ID is missing. Please try again.');
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
        // Type assertion to ensure TypeScript knows data has the expected properties
        const courseData = data as {
          name: string;
          location: string;
          holes: number;
          par: number;
          rating: number;
          slope: number;
          amenities: string | string[] | null;
          website: string | null;
          phone_number: string | null;
          is_active: boolean | null;
        };
        
        setFormData({
          name: courseData.name || '',
          location: courseData.location || '',
          holes: courseData.holes || 18,
          par: courseData.par || 72,
          rating: courseData.rating || 72.0,
          slope: courseData.slope || 113,
          amenities: courseData.amenities ? 
            (typeof courseData.amenities === 'string' ? 
              JSON.parse(courseData.amenities).join(', ') : 
              Array.isArray(courseData.amenities) ? 
                courseData.amenities.join(', ') : 
                String(courseData.amenities)) : 
            '',
          website: courseData.website || '',
          phoneNumber: courseData.phone_number || '',
          isActive: courseData.is_active !== null ? Boolean(courseData.is_active) : true
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
  
  // Validate form data
  const validateForm = () => {
    if (!formData.name || !formData.location) {
      setError('Name and location are required fields');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Try to refresh the schema cache first
      await refreshSchemaCache();
      
      console.log('Submitting course data:', formData);
      console.log('Is course active?', formData.isActive);

      // Prepare the course data
      const courseData = {
        name: formData.name,
        location: formData.location,
        par: parseInt(formData.par.toString(), 10),
        holes: parseInt(formData.holes.toString(), 10),
        rating: formData.rating ? parseFloat(formData.rating.toString()) : null,
        slope: formData.slope ? parseInt(formData.slope.toString(), 10) : null,
        amenities: formData.amenities ? JSON.stringify(formData.amenities.split(',').map(item => item.trim()).filter(item => item !== '')) : null,
        website: formData.website || null,
        phone_number: formData.phoneNumber || null,
        is_active: formData.isActive
      };

      console.log('Prepared course data:', courseData);

      let savedCourseId;

      if (isEditMode && courseId) {
        // Update existing course
        console.log(`Updating course with ID: ${courseId}`);
        
        // Try using the PostgreSQL function first
        const { data: updatedCourse, error: rpcError } = await supabase.rpc(
          'update_course_with_active',
          {
            p_id: courseId,
            p_name: courseData.name,
            p_location: courseData.location,
            p_par: courseData.par,
            p_holes: courseData.holes,
            p_rating: courseData.rating,
            p_slope: courseData.slope,
            p_amenities: courseData.amenities,
            p_website: courseData.website,
            p_phone_number: courseData.phone_number,
            p_is_active: courseData.is_active
          }
        );
        
        if (rpcError) {
          console.error('Error updating course via RPC:', rpcError);
          
          // Fall back to the previous approach
          const { data: updatedCourse, error: updateError } = await supabase
            .from('courses')
            .update(courseData)
            .eq('id', courseId)
            .select();
          
          if (updateError) {
            console.error('Error updating course:', updateError);
            
            // If that fails, try updating without is_active first
            const courseDataWithoutActive = {
              name: courseData.name,
              location: courseData.location,
              par: courseData.par,
              holes: courseData.holes,
              rating: courseData.rating,
              slope: courseData.slope,
              amenities: courseData.amenities,
              website: courseData.website,
              phone_number: courseData.phone_number
            };
            
            console.log('Trying update without is_active field:', courseDataWithoutActive);
            
            const { error: updateWithoutActiveError } = await supabase
              .from('courses')
              .update(courseDataWithoutActive)
              .eq('id', courseId);
              
            if (updateWithoutActiveError) {
              console.error('Error updating course without is_active:', updateWithoutActiveError);
              throw new Error(`Failed to update course: ${updateWithoutActiveError.message}`);
            }
            
            // Then try to update just the is_active field separately
            console.log('Now trying to update just the is_active field');
            const { error: activeUpdateError } = await supabase
              .from('courses')
              .update({ is_active: formData.isActive })
              .eq('id', courseId);
              
            if (activeUpdateError) {
              console.error('Error updating is_active field:', activeUpdateError);
              console.warn('Course was updated but the active status may not have been saved correctly');
            }
          }
          
          savedCourseId = courseId;
        } else {
          console.log('Course updated successfully via RPC');
          savedCourseId = courseId;
        }
      } else {
        // Create new course
        console.log('Creating new course');
        
        // Try using the PostgreSQL function first
        const { data: newCourse, error: rpcError } = await supabase.rpc(
          'insert_course_with_active',
          {
            p_name: courseData.name,
            p_location: courseData.location,
            p_par: courseData.par,
            p_holes: courseData.holes,
            p_rating: courseData.rating,
            p_slope: courseData.slope,
            p_amenities: courseData.amenities,
            p_website: courseData.website,
            p_phone_number: courseData.phone_number,
            p_is_active: courseData.is_active
          }
        );
        
        if (rpcError) {
          console.error('Error inserting course via RPC:', rpcError);
          
          // Fall back to the previous approach
          const { data: newCourse, error: insertError } = await supabase
            .from('courses')
            .insert(courseData)
            .select();

          if (insertError) {
            console.error('Error inserting course:', insertError);
            
            // If that fails, try inserting without is_active
            const courseDataWithoutActive = {
              name: courseData.name,
              location: courseData.location,
              par: courseData.par,
              holes: courseData.holes,
              rating: courseData.rating,
              slope: courseData.slope,
              amenities: courseData.amenities,
              website: courseData.website,
              phone_number: courseData.phone_number
            };
            
            console.log('Trying insert without is_active field:', courseDataWithoutActive);
            
            const { data: insertedWithoutActive, error: insertWithoutActiveError } = await supabase
              .from('courses')
              .insert(courseDataWithoutActive)
              .select();
              
            if (insertWithoutActiveError) {
              console.error('Error inserting course without is_active:', insertWithoutActiveError);
              throw new Error(`Failed to create course: ${insertWithoutActiveError.message}`);
            }
            
            savedCourseId = insertedWithoutActive?.[0]?.id;
            
            // Then try to update just the is_active field separately
            if (savedCourseId) {
              console.log('Now trying to update just the is_active field');
              const { error: activeUpdateError } = await supabase
                .from('courses')
                .update({ is_active: formData.isActive })
                .eq('id', savedCourseId);
                
              if (activeUpdateError) {
                console.error('Error updating is_active field:', activeUpdateError);
                console.warn('Course was created but the active status may not have been saved correctly');
              }
            }
          } else {
            console.log('Course created successfully');
            savedCourseId = newCourse?.[0]?.id;
          }
        } else {
          console.log('Course created successfully via RPC');
          savedCourseId = newCourse?.[0]?.id;
        }
      }

      console.log('Course saved successfully with ID:', savedCourseId);
      setSuccess(true);
      
      // Verify the course was saved with the correct is_active value
      if (savedCourseId) {
        try {
          console.log(`Verifying is_active status for course ${savedCourseId}`);
          const { data: verifyData, error: verifyError } = await supabase
            .from('courses')
            .select('is_active')
            .eq('id', savedCourseId)
            .single();
          
          if (verifyError) {
            console.error('Error verifying course active status:', verifyError);
          } else if (verifyData) {
            console.log('Verified course active status:', verifyData.is_active);
            if (verifyData.is_active !== formData.isActive) {
              console.warn('Course active status mismatch!', {
                submitted: formData.isActive,
                saved: verifyData.is_active
              });
            }
          }
        } catch (verifyErr) {
          console.error('Exception during verification:', verifyErr);
        }
      }

      // Redirect or reset form
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
      console.error('Error in handleSubmit:', err);
      
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        setError(`Failed to save course: ${err.message}`);
      } else {
        console.error('Unknown error type:', err);
        setError('Failed to save course due to an unknown error. Please try again.');
      }
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
            
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                backgroundColor: formData.isActive ? '#e8f5e9' : '#ffebee'
              }}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Visibility
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      color="primary"
                    />
                  }
                  label={<Typography fontWeight="bold">{formData.isActive ? "Course is active" : "Course is inactive"}</Typography>}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {formData.isActive 
                    ? "This course will be visible when creating events." 
                    : "This course will NOT be visible when creating events. Activate it to use in events."}
                </Typography>
              </Box>
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