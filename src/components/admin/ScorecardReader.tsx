import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert, 
  Divider,
  TextField,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { supabaseClient } from '@/lib/auth';

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

interface ExtractedCourseData {
  name: string;
  location: string;
  holes: number;
  par: number;
  teeSets: {
    name: string;
    color: string;
    rating: number;
    slope: number;
    distance: number;
  }[];
  holeDetails: {
    number: number;
    par: number;
    distances: Record<string, number>;
  }[];
}

export default function ScorecardReader() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedCourseData | null>(null);
  const [success, setSuccess] = useState(false);

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
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const processScorecard = async () => {
    if (!file) {
      setError('Please select a scorecard image first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Upload the file to Supabase Storage
      const fileName = `scorecards/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('golf-compete')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabaseClient
        .storage
        .from('golf-compete')
        .getPublicUrl(fileName);
      
      const imageUrl = urlData.publicUrl;
      
      // TODO: In a real implementation, this would call an AI service
      // For now, we'll simulate the AI response with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate extracted data (in a real app, this would come from the AI service)
      const mockExtractedData: ExtractedCourseData = {
        name: "Pine Valley Golf Club",
        location: "Pine Valley, NJ",
        holes: 18,
        par: 72,
        teeSets: [
          { name: "Championship", color: "Black", rating: 74.9, slope: 155, distance: 7181 },
          { name: "Member", color: "Blue", rating: 72.8, slope: 148, distance: 6532 },
          { name: "Regular", color: "White", rating: 70.7, slope: 140, distance: 6127 }
        ],
        holeDetails: Array.from({ length: 18 }, (_, i) => ({
          number: i + 1,
          par: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3,
          distances: {
            "Black": 400 + Math.floor(Math.random() * 200),
            "Blue": 370 + Math.floor(Math.random() * 180),
            "White": 340 + Math.floor(Math.random() * 160)
          }
        }))
      };
      
      setExtractedData(mockExtractedData);
      setSuccess(true);
      
    } catch (err) {
      console.error('Error processing scorecard:', err);
      setError('Failed to process the scorecard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    if (!extractedData) return;
    
    try {
      setLoading(true);
      
      // Format course data for submission
      const courseSubmitData = {
        name: extractedData.name,
        location: extractedData.location,
        holes: extractedData.holes,
        par: extractedData.par,
        rating: extractedData.teeSets[0].rating, // Use the first tee set's rating
        slope: extractedData.teeSets[0].slope, // Use the first tee set's slope
        amenities: JSON.stringify([]),
      };
      
      // Insert course
      const { data: insertedCourse, error: courseError } = await supabaseClient
        .from('courses')
        .insert(courseSubmitData)
        .select()
        .single();
      
      if (courseError) throw courseError;
      
      // Insert tee sets
      const teeSetInsertPromises = extractedData.teeSets.map(teeSet => {
        return supabaseClient
          .from('tee_sets')
          .insert({
            courseId: insertedCourse.id,
            name: teeSet.name,
            color: teeSet.color,
            rating: teeSet.rating,
            slope: teeSet.slope,
            par: extractedData.par,
            distance: teeSet.distance
          })
          .select()
          .single();
      });
      
      const teeSetResults = await Promise.all(teeSetInsertPromises);
      const insertedTeeSets = teeSetResults.map(result => result.data);
      
      // Insert holes
      const holeInsertPromises = extractedData.holeDetails.map(hole => {
        return supabaseClient
          .from('holes')
          .insert({
            courseId: insertedCourse.id,
            holeNumber: hole.number,
            par: hole.par,
            handicapIndex: hole.number, // Default to hole number, can be updated later
          })
          .select()
          .single();
      });
      
      const holeResults = await Promise.all(holeInsertPromises);
      const insertedHoles = holeResults.map(result => result.data);
      
      // Insert tee set distances
      for (let holeIndex = 0; holeIndex < insertedHoles.length; holeIndex++) {
        const hole = insertedHoles[holeIndex];
        const holeDetail = extractedData.holeDetails[holeIndex];
        
        for (let teeSetIndex = 0; teeSetIndex < insertedTeeSets.length; teeSetIndex++) {
          const teeSet = insertedTeeSets[teeSetIndex];
          const teeColor = extractedData.teeSets[teeSetIndex].color;
          const distance = holeDetail.distances[teeColor];
          
          if (distance && hole && teeSet) {
            await supabaseClient
              .from('tee_set_distances')
              .insert({
                teeSetId: teeSet.id,
                holeId: hole.id,
                distance: distance
              });
          }
        }
      }
      
      setSuccess(true);
      alert('Course, tee sets, holes, and distances saved successfully!');
      
      // Reset the form
      setFile(null);
      setImagePreview(null);
      setExtractedData(null);
      
    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save the course data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        AI Scorecard Reader
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload a golf course scorecard image and our AI will extract course details, tee sets, and hole information automatically.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && !loading && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Scorecard processed successfully!
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
            disabled={loading}
          >
            Upload Scorecard
            <VisuallyHiddenInput type="file" onChange={handleFileChange} accept="image/*" />
          </Button>
          
          {file && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Selected file: {file.name}
            </Typography>
          )}
          
          {imagePreview && (
            <Box sx={{ mt: 2, mb: 3, maxWidth: '100%', overflow: 'hidden' }}>
              <img 
                src={imagePreview} 
                alt="Scorecard preview" 
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
              />
            </Box>
          )}
          
          <Button
            variant="contained"
            color="primary"
            onClick={processScorecard}
            disabled={!file || loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Process Scorecard'}
          </Button>
        </Box>
      </Paper>
      
      {extractedData && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Extracted Course Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={extractedData.name}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={extractedData.location}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Holes"
                value={extractedData.holes}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            <Grid item xs={6} md={3}>
              <TextField
                fullWidth
                label="Par"
                value={extractedData.par}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Tee Sets
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            {extractedData.teeSets.map((teeSet, index) => (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={teeSet.name}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        label="Color"
                        value={teeSet.color}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        label="Rating"
                        value={teeSet.rating}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        label="Slope"
                        value={teeSet.slope}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        label="Distance"
                        value={teeSet.distance}
                        InputProps={{ readOnly: true }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={saveCourse}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Course'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
} 