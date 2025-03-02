import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Grid, 
  CircularProgress, 
  Paper,
  Chip,
  InputAdornment,
  IconButton,
  Alert,
  FormControlLabel,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import Image from 'next/image';
import { useCourseCreationContext } from '@/contexts/CourseCreationContext';

// Styled component for the file input
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface CourseInfoStepProps {
  existingImage?: ScorecardImage;
}

export default function CourseInfoStep({ existingImage }: CourseInfoStepProps) {
  const { course, setCourse, scorecardImage, setImageFile, nextStep } = useCourseCreationContext();
  const [file, setFile] = useState<File | null>(existingImage?.file || null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingImage?.previewUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [aiProcessed, setAiProcessed] = useState(false);
  const [useExistingImage, setUseExistingImage] = useState(!!existingImage?.file);

  useEffect(() => {
    // If there's an existing image and we're using it, set the file and preview
    if (existingImage?.file && useExistingImage) {
      setFile(existingImage.file);
      setImagePreview(existingImage.previewUrl);
    }
  }, [existingImage, useExistingImage]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      // Check if file is an image
      if (!selectedFile.type.match('image.*')) {
        setError('Please select an image file (JPEG, PNG)');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setAiProcessed(false);
      setUseExistingImage(false);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const processImage = async () => {
    if (!file) {
      setError('Please select a scorecard image first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Create form data for API call
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extractType', 'courseInfo');
      
      // Call our API endpoint
      const response = await fetch('/api/scorecard', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process image');
      }
      
      // Update course info with extracted data
      if (result.success && result.data) {
        console.log('Received course info:', result.data);
        
        setCourse((prev) => ({
          ...prev,
          name: result.data.name || prev.name,
          location: result.data.location || prev.location,
          phoneNumber: result.data.phoneNumber || prev.phoneNumber,
          email: result.data.email || prev.email,
          website: result.data.website || prev.website,
          amenities: result.data.amenities || prev.amenities,
        }));
        
        setAiProcessed(true);
      } else {
        console.error('No data in response:', result);
        throw new Error('No data received from API');
      }
      
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process the image. Please try again or enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourse((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim()) {
      setCourse((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleDeleteAmenity = (amenityToDelete: string) => {
    setCourse((prev) => ({
      ...prev,
      amenities: prev.amenities.filter(amenity => amenity !== amenityToDelete)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!course.name || !course.location) {
      setError('Course name and location are required');
      return;
    }
    
    // Proceed to next step
    nextStep();
  };

  const toggleUseExistingImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useExisting = event.target.checked;
    setUseExistingImage(useExisting);
    
    if (useExisting && existingImage) {
      setFile(existingImage.file);
      setImagePreview(existingImage.previewUrl);
    } else {
      setFile(null);
      setImagePreview(null);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Course Information
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Upload Course Information Image
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload an image of the course information section from the scorecard. This typically includes the course name, location, and contact details.
        </Typography>
        
        {existingImage?.file && (
          <FormControlLabel
            control={
              <Switch 
                checked={useExistingImage} 
                onChange={toggleUseExistingImage}
              />
            }
            label="Use existing course info image"
            sx={{ mb: 2 }}
          />
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
            disabled={loading || (useExistingImage && !!existingImage?.file)}
          >
            Upload Image
            <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*" />
          </Button>
          
          {file && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected file: {file.name}
            </Typography>
          )}
          
          {imagePreview && (
            <Box sx={{ mt: 2, mb: 3, maxWidth: '100%', overflow: 'hidden' }}>
              <Image 
                src={imagePreview} 
                alt="Scorecard preview" 
                width={800}
                height={300}
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
              />
            </Box>
          )}
          
          <Button
            variant="contained"
            color="primary"
            onClick={processImage}
            disabled={!file || loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Extract Course Info'}
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Course Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Course Name"
              name="name"
              value={course.name || ''}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Location"
              name="location"
              value={course.location || ''}
              onChange={handleInputChange}
              placeholder="City, State"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={course.phoneNumber || ''}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={course.email || ''}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Website"
              name="website"
              value={course.website || ''}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Amenities
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {course.amenities && course.amenities.map((amenity, index) => (
                <Chip 
                  key={index} 
                  label={amenity} 
                  onDelete={() => handleDeleteAmenity(amenity)}
                />
              ))}
            </Box>
            
            <TextField
              fullWidth
              label="Add Amenity"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={handleAddAmenity}
                      disabled={!newAmenity.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newAmenity.trim()) {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!course.name || !course.location}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
