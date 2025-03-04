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
  Typography,
  useTheme
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
  courseId,
  isMobile
}) => {
  const theme = useTheme();
  
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
  
  // Handle switch changes
  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // Handle course data extraction (if implemented)
  const handleCourseDataExtracted = (extractedData: any) => {
    if (extractedData && typeof extractedData === 'object') {
      // Merge extracted data with existing form data
      setFormData(prevData => ({
        ...prevData,
        ...extractedData
      }));
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Extract Course Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Upload an image of the course information or scorecard to automatically extract details.
          </Typography>
        </Box>
        
        {processingImage !== undefined && setProcessingImage && extractionStep !== undefined && setExtractionStep ? (
          <ImageUploader
            step="course"
            processingImage={processingImage}
            setProcessingImage={setProcessingImage}
            extractionStep={extractionStep}
            setExtractionStep={setExtractionStep}
            onDataExtracted={handleCourseDataExtracted}
            isMobile={isMobile}
          />
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Image upload functionality is currently unavailable.
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="name"
              name="name"
              label="Course Name"
              value={formData.name}
              onChange={handleTextChange}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="location"
              name="location"
              label="Location"
              value={formData.location}
              onChange={handleTextChange}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              placeholder="City, State"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="holes-label">Number of Holes</InputLabel>
              <Select
                labelId="holes-label"
                id="holes"
                name="holes"
                value={formData.holes.toString()}
                label="Number of Holes"
                onChange={handleSelectChange}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                <MenuItem value="9">9</MenuItem>
                <MenuItem value="18">18</MenuItem>
                <MenuItem value="27">27</MenuItem>
                <MenuItem value="36">36</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
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
                size={isMobile ? "small" : "medium"}
              >
                {Array.from({ length: 15 }, (_, i) => i + 66).map(par => (
                  <MenuItem key={par} value={par.toString()}>{par}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Additional Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="amenities"
              name="amenities"
              label="Amenities"
              value={formData.amenities}
              onChange={handleTextChange}
              disabled={loading}
              multiline
              rows={2}
              size={isMobile ? "small" : "medium"}
              placeholder="Pro shop, restaurant, practice facilities, etc."
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="website"
              name="website"
              label="Website"
              value={formData.website}
              onChange={handleTextChange}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              placeholder="https://www.example.com"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="phoneNumber"
              name="phoneNumber"
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleTextChange}
              disabled={loading}
              size={isMobile ? "small" : "medium"}
              placeholder="(555) 555-5555"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleSwitchChange}
                  name="isActive"
                  disabled={loading}
                />
              }
              label="Active Course"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !formData.name}
          sx={{ minWidth: isMobile ? '100%' : 'auto' }}
        >
          {isEditMode ? 'Update Course' : 'Save and Continue'}
        </Button>
      </Box>
    </Box>
  );
};

export default CourseInfoStep; 