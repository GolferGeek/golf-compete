import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  CircularProgress, 
  Paper,
  Alert,
  IconButton,
  FormControlLabel,
  Switch,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import { styled } from '@mui/material/styles';
import Image from 'next/image';
import { useCourseCreationContext } from '@/contexts/CourseCreationContext';
import ScorecardReader from '../ScorecardReader';

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

interface TeeSetStepProps {
  initialData: any[];
  onComplete: (data: any[], image?: File) => void;
  existingImage?: File;
  courseInfoImage?: File;
}

export default function TeeSetStep() {
  const { teeSets, setTeeSets, teeSetImage, setTeeSetImage, nextStep, prevStep } = useCourseCreationContext();
  
  const [currentTeeSet, setCurrentTeeSet] = useState({
    name: '',
    color: '',
    rating: 0,
    slope: 0
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useExistingImage, setUseExistingImage] = useState(false);
  const [useCourseInfoImage, setUseCourseInfoImage] = useState(false);

  useEffect(() => {
    // If there's an existing image and we're using it, set the file and preview
    if (teeSetImage && useExistingImage) {
      setFile(teeSetImage);
      setImagePreview(URL.createObjectURL(teeSetImage));
    } else if (teeSetImage && useCourseInfoImage) {
      setFile(teeSetImage);
      setImagePreview(URL.createObjectURL(teeSetImage));
    }
  }, [teeSetImage, useExistingImage, useCourseInfoImage]);

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
      setSuccess(false);
      setUseExistingImage(false);
      setUseCourseInfoImage(false);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const toggleUseExistingImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useExisting = event.target.checked;
    setUseExistingImage(useExisting);
    
    if (useExisting && teeSetImage) {
      setFile(teeSetImage);
      setImagePreview(URL.createObjectURL(teeSetImage));
      setUseCourseInfoImage(false);
    } else if (!useCourseInfoImage) {
      setFile(null);
      setImagePreview(null);
    }
  };

  const toggleUseCourseInfoImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useCourseInfo = event.target.checked;
    setUseCourseInfoImage(useCourseInfo);
    
    if (useCourseInfo && teeSetImage) {
      setFile(teeSetImage);
      setImagePreview(URL.createObjectURL(teeSetImage));
      setUseExistingImage(false);
    } else if (!useExistingImage) {
      setFile(null);
      setImagePreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTeeSet(prev => ({
      ...prev,
      [name]: name === 'rating' || name === 'slope' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddTeeSet = () => {
    // Validate inputs
    if (!currentTeeSet.name || !currentTeeSet.color) {
      setError('Name and color are required');
      return;
    }
    
    if (editingIndex !== null) {
      // Update existing tee set
      const updatedTeeSets = [...teeSets];
      updatedTeeSets[editingIndex] = { ...currentTeeSet };
      setTeeSets(updatedTeeSets);
      setEditingIndex(null);
    } else {
      // Add new tee set
      setTeeSets([...teeSets, { ...currentTeeSet }]);
    }
    
    // Reset form
    setCurrentTeeSet({
      name: '',
      color: '',
      rating: 0,
      slope: 0
    });
    setError(null);
  };

  const handleEditTeeSet = (index: number) => {
    setCurrentTeeSet(teeSets[index]);
    setEditingIndex(index);
  };

  const handleDeleteTeeSet = (index: number) => {
    const updatedTeeSets = teeSets.filter((_, i) => i !== index);
    setTeeSets(updatedTeeSets);
  };

  const handleCancel = () => {
    setCurrentTeeSet({
      name: '',
      color: '',
      rating: 0,
      slope: 0
    });
    setEditingIndex(null);
    setError(null);
  };

  const handleExtractTeeSets = async () => {
    if (!file) {
      setError('Please upload a scorecard image first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extractType', 'teeSets');

      // Call the API
      const response = await fetch('/api/scorecard', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract tee sets');
      }

      const result = await response.json();

      if (result.success && result.data && Array.isArray(result.data)) {
        // Update the tee sets with the extracted data
        setTeeSets(result.data);
        
        // Also save the image for later use
        if (file) {
          setTeeSetImage(file);
        }
        setSuccess(true);
      } else {
        throw new Error(result.error || 'No tee sets extracted');
      }
    } catch (err) {
      console.error('Error extracting tee sets:', err);
      setError(err.message || 'Failed to extract tee sets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    // Validate that we have at least one tee set
    if (teeSets.length === 0) {
      setError('Please add at least one tee set');
      return;
    }
    
    // Proceed to next step
    nextStep();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Tee Sets
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Tee sets extracted successfully!
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Tee Sets
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Tee sets extracted successfully!
          </Alert>
        )}
        
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Upload an image of the tee set information from the scorecard. This typically includes tee colors, ratings, and slopes.
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {teeSetImage && (
            <FormControlLabel
              control={
                <Switch 
                  checked={useExistingImage} 
                  onChange={toggleUseExistingImage}
                  disabled={useCourseInfoImage}
                />
              }
              label="Use existing tee set image"
              sx={{ display: 'block', mb: 1 }}
            />
          )}
          
          {teeSetImage && (
            <FormControlLabel
              control={
                <Switch 
                  checked={useCourseInfoImage} 
                  onChange={toggleUseCourseInfoImage}
                  disabled={useExistingImage}
                />
              }
              label="Use course info image"
              sx={{ display: 'block' }}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
            disabled={loading || (useExistingImage && !!teeSetImage) || (useCourseInfoImage && !!teeSetImage)}
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
            onClick={handleExtractTeeSets}
            disabled={!file || loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Extract Tee Sets'}
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          onClick={handleExtractTeeSets}
          disabled={loading || !teeSetImage}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ mb: 2 }}
        >
          {loading ? 'Extracting...' : 'Extract from Scorecard'}
        </Button>
        
        {teeSets.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tee Sets
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Slope</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teeSets.map((teeSet, index) => (
                    <TableRow key={index}>
                      <TableCell>{teeSet.name}</TableCell>
                      <TableCell>{teeSet.color}</TableCell>
                      <TableCell>{teeSet.rating}</TableCell>
                      <TableCell>{teeSet.slope}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditTeeSet(index)}
                          aria-label="edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteTeeSet(index)}
                          aria-label="delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {editingIndex !== null ? 'Edit Tee Set' : 'Add New Tee Set'}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={currentTeeSet.name}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Color"
                name="color"
                value={currentTeeSet.color}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rating"
                name="rating"
                type="number"
                value={currentTeeSet.rating}
                onChange={handleInputChange}
                margin="normal"
                inputProps={{ step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Slope"
                name="slope"
                type="number"
                value={currentTeeSet.slope}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                {editingIndex !== null && (
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    onClick={handleCancel}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleAddTeeSet}
                >
                  {editingIndex !== null ? 'Update' : 'Add'} Tee Set
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={prevStep}
        >
          Back
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={teeSets.length === 0}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
