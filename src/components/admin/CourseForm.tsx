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
  SelectChangeEvent
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/auth';

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
      
      const { data, error } = await supabaseClient
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
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
          amenities: data.amenities || '',
          website: data.website || '',
          phoneNumber: data.phone_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);
  
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
        amenities: formData.amenities ? JSON.stringify(formData.amenities.split(',').map(item => item.trim())) : null,
        website: formData.website || null,
        phone_number: formData.phoneNumber || null,
      };
      
      let result;
      
      if (isEditMode) {
        // Update existing course
        result = await supabaseClient
          .from('courses')
          .update(courseData)
          .eq('id', courseId);
      } else {
        // Insert new course
        result = await supabaseClient
          .from('courses')
          .insert(courseData);
      }
      
      if (result.error) throw result.error;
      
      setSuccess(true);
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/admin/courses');
      }, 1500);
      
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
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
            helperText="Comma-separated list (e.g., Driving Range, Pro Shop, Restaurant)"
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
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 