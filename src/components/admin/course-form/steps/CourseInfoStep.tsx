import React from 'react';
import { 
  Box, 
  Button, 
  Divider, 
  FormControl, 
  FormControlLabel, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  SelectChangeEvent, 
  Switch, 
  TextField, 
  Typography 
} from '@mui/material';
import { CourseInfoStepProps } from '../types';
import ImageUploader from '../components/ImageUploader';

const CourseInfoStep: React.FC<CourseInfoStepProps> = ({
  formData,
  setFormData,
  loading,
  handleSubmit,
  isEditMode,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep,
  router,
  courseId
}) => {
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
  
  // Handle image extraction data
  const handleCourseDataExtracted = (extractedData: any) => {
    // Update course information without auto-submitting
    setFormData({
      ...formData,
      name: extractedData.name || formData.name,
      location: extractedData.location || formData.location,
      phoneNumber: extractedData.phoneNumber || formData.phoneNumber,
      website: extractedData.website || formData.website,
      // Keep other fields as they are
      holes: formData.holes,
      par: formData.par,
      amenities: formData.amenities,
      isActive: formData.isActive
    });
    
    // Show success message for course info
    console.log('Successfully extracted course data from image');
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* AI-Assisted Data Extraction Card */}
      <ImageUploader
        step="course"
        processingImage={processingImage}
        setProcessingImage={setProcessingImage}
        extractionStep={extractionStep}
        setExtractionStep={setExtractionStep}
        onDataExtracted={handleCourseDataExtracted}
      />

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
              id="holes"
              name="holes"
              value={formData.holes.toString()}
              label="Holes"
              onChange={handleSelectChange}
              disabled={loading}
            >
              <MenuItem value={9}>9</MenuItem>
              <MenuItem value={18}>18</MenuItem>
              <MenuItem value={27}>27</MenuItem>
              <MenuItem value={36}>36</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel id="par-label">Par</InputLabel>
            <Select
              labelId="par-label"
              id="par"
              name="par"
              value={formData.par.toString()}
              label="Par"
              onChange={handleSelectChange}
              disabled={loading}
            >
              {[...Array(20)].map((_, i) => (
                <MenuItem key={i + 60} value={i + 60}>
                  {i + 60}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Amenities"
            name="amenities"
            value={formData.amenities}
            onChange={handleTextChange}
            disabled={loading}
            helperText="Comma-separated list of amenities (e.g. Pro Shop, Restaurant, Driving Range)"
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
              {isEditMode && courseId && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => router.push(`/admin/courses/${courseId}/tee-boxes`)}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Skip to Tee Boxes
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : isEditMode ? 'Save & Continue' : 'Save and Continue'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseInfoStep; 