import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  CircularProgress, 
  Paper,
  Alert
} from '@mui/material';
import { useCourseCreationContext } from '@/contexts/CourseCreationContext';
import ScorecardReader from '../ScorecardReader';
import ScorecardEditor from '../scorecard/ScorecardEditor';

export default function ScorecardStep() {
  const { 
    holes, 
    setHoles, 
    teeSets, 
    scorecardImage, 
    setScorecardImage, 
    nextStep, 
    prevStep, 
    submitCourse, 
    isSubmitting 
  } = useCourseCreationContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Add a local state for the image preview only
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Update image preview when scorecardImage changes
  useEffect(() => {
    if (scorecardImage) {
      const objectUrl = URL.createObjectURL(scorecardImage);
      setImagePreview(objectUrl);
      
      // Clean up the URL when component unmounts or image changes
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
  }, [scorecardImage]);

  // Handle scorecard image upload
  const handleScorecardImageSelected = (file: File) => {
    console.log('Scorecard image selected:', file.name);
    setScorecardImage(file);
  };

  const handleExtractScorecard = async () => {
    if (!scorecardImage) {
      setError('No scorecard image available');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Extracting scorecard data from image:', scorecardImage.name);
      console.log('Image size:', scorecardImage.size, 'bytes');
      console.log('Image type:', scorecardImage.type);
      
      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', scorecardImage);
      formData.append('extractType', 'scorecard');
      
      // Add tee colors if available
      if (teeSets.length > 0) {
        const teeColors = teeSets.map(tee => tee.color);
        formData.append('teeColors', JSON.stringify(teeColors));
      }
      
      // Call the API
      const response = await fetch('/api/scorecard', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract scorecard data');
      }
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('Raw API response data:', result.data);
        
        // Map the extracted data to our hole details format
        const extractedHoles = result.data.map((hole: any) => {
          console.log('Processing hole:', hole);
          
          // IMPORTANT: Process the distances object to ensure all values are integers
          const rawDistances = hole.distances || {};
          const distances: Record<string, number> = {};
          
          // Convert each distance to a number and ensure all tee sets have a value
          teeSets.forEach(teeSet => {
            const rawValue = rawDistances[teeSet.color];
            distances[teeSet.color] = typeof rawValue === 'number' ? rawValue : 0;
          });
          
          return {
            number: hole.number,
            par: typeof hole.par === 'number' ? hole.par : 4,
            handicapIndex: typeof hole.handicapIndex === 'number' ? hole.handicapIndex : hole.number,
            distances: distances
          };
        });
        
        console.log('Extracted holes:', extractedHoles);
        setHoles(extractedHoles);
        setSuccess(true);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error extracting scorecard:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract scorecard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScorecard = async (updatedHoles: any[]) => {
    try {
      setHoles(updatedHoles);
      return Promise.resolve();
    } catch (err) {
      console.error('Error saving scorecard:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    try {
      await submitCourse();
    } catch (err) {
      console.error('Error submitting course:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit course');
    }
  };

  // Format tee sets for the ScorecardEditor component
  const formattedTeeSets = teeSets.map(teeSet => ({
    id: teeSet.color, // In the wizard, we use color as the ID
    name: teeSet.name,
    color: teeSet.color,
    rating: teeSet.rating,
    slope: teeSet.slope
  }));

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Course Scorecard
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Scorecard Image (Optional)
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Upload an image of the scorecard to automatically extract hole details.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ScorecardReader 
              onImageSelected={handleScorecardImageSelected}
              buttonText="Upload Scorecard Image"
              disabled={loading}
              imagePreview={imagePreview}
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleExtractScorecard}
              disabled={loading || !scorecardImage}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ mt: 2 }}
            >
              {loading ? 'Extracting...' : 'Extract Data'}
            </Button>
            
            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Scorecard Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    border: '1px solid #ccc'
                  }} 
                />
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Scorecard data extracted successfully!
              </Alert>
            )}
            
            <Typography variant="body2">
              {loading ? 'Processing scorecard image...' : 'Upload a scorecard image and click "Extract Data" to automatically populate the hole details.'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Scorecard Editor */}
      <ScorecardEditor
        courseId="temp-wizard-id" // Temporary ID for the wizard
        teeSets={formattedTeeSets}
        holes={holes}
        onSave={handleSaveScorecard}
        loading={loading}
      />
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          onClick={prevStep}
          disabled={isSubmitting}
        >
          Back to Tee Boxes
        </Button>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Save and Finish'}
        </Button>
      </Box>
    </Box>
  );
}
