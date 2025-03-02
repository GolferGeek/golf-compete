import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  CircularProgress, 
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { useCourseCreationContext } from '@/contexts/CourseCreationContext';
import ScorecardReader from '../ScorecardReader';

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
  const [editingCell, setEditingCell] = useState<{
    holeIndex: number;
    field: string;
    teeColor?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

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

  // Initialize holes if empty
  useEffect(() => {
    if (holes.length === 0) {
      console.log('Initializing default holes with tee sets:', teeSets);
      
      // Create default 18 holes
      const defaultHoles = Array.from({ length: 18 }, (_, i) => {
        // Create distances object with explicit values for each tee set
        const distances: Record<string, number> = {};
        
        // Add each tee set with a default distance of 0
        teeSets.forEach(teeSet => {
          distances[teeSet.color] = 0;
        });
        
        console.log(`Hole ${i+1} distances:`, distances);
        
        return {
          number: i + 1,
          par: 4,
          handicapIndex: i + 1,
          distances: distances
        };
      });
      
      console.log('Setting default holes:', defaultHoles);
      setHoles(defaultHoles);
    }
  }, [holes.length, teeSets, setHoles]);

  useEffect(() => {
    console.log('HOLES UPDATED:', JSON.stringify(holes, null, 2));
    console.log('TEE SETS:', JSON.stringify(teeSets, null, 2));
  }, [holes, teeSets]);

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
          
          // Convert all distance values to integers
          Object.keys(rawDistances).forEach(key => {
            // Parse the distance as an integer, defaulting to 0 if invalid
            const distanceValue = parseInt(rawDistances[key]) || 0;
            distances[key] = distanceValue;
            console.log(`Parsed distance for ${key}: ${rawDistances[key]} -> ${distanceValue}`);
          });
          
          console.log('Processed distances:', distances);
          
          return {
            number: parseInt(hole.number) || 0,
            par: parseInt(hole.par) || 4,
            handicapIndex: parseInt(hole.handicapIndex) || 0,
            distances
          };
        });
        
        console.log('Extracted holes:', extractedHoles);
        
        // Only use extracted data if we got at least one valid hole
        if (extractedHoles.length > 0) {
          // Force a complete state update by creating a new array
          console.log('Setting holes state with extracted data');
          setHoles([...extractedHoles]);
          setSuccess(true);
          
          // Force a re-render
          setTimeout(() => {
            console.log('Current holes state after update:', holes);
          }, 100);
        } else {
          throw new Error('No valid holes extracted');
        }
      } else {
        throw new Error(result.error || 'No scorecard data extracted');
      }
    } catch (err) {
      console.error('Error extracting scorecard data:', err);
      setError(err.message || 'Failed to extract scorecard data');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (holeIndex: number, field: string, teeColor?: string) => {
    const hole = holes[holeIndex];
    let value = '';
    
    if (field === 'par') {
      value = hole.par.toString();
    } else if (field === 'handicapIndex') {
      value = hole.handicapIndex.toString();
    } else if (field === 'distance' && teeColor) {
      value = hole.distances[teeColor]?.toString() || '0';
    }
    
    setEditingCell({ holeIndex, field, teeColor });
    setEditValue(value);
  };

  const handleCellValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const stopEditing = () => {
    if (!editingCell) return;
    
    const { holeIndex, field, teeColor } = editingCell;
    const newValue = parseInt(editValue) || 0;
    
    console.log(`Updating ${field} for hole ${holeIndex + 1} to ${newValue}`, teeColor ? `(tee: ${teeColor})` : '');
    
    // Update the hole data
    const updatedHoles = [...holes];
    const hole = { ...updatedHoles[holeIndex] };
    
    if (field === 'par') {
      hole.par = newValue;
    } else if (field === 'handicapIndex') {
      hole.handicapIndex = newValue;
    } else if (field === 'distance' && teeColor) {
      // Make sure distances object exists
      if (!hole.distances) {
        hole.distances = {};
      }
      
      // Create a new distances object to ensure state update
      hole.distances = {
        ...hole.distances,
        [teeColor]: newValue
      };
      
      console.log(`Updated distances for hole ${hole.number}:`, hole.distances);
    }
    
    updatedHoles[holeIndex] = hole;
    console.log('Setting updated holes:', updatedHoles);
    setHoles(updatedHoles);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      stopEditing();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleSubmit = () => {
    // Validate that we have valid hole data
    const isValid = holes.every(hole => 
      hole.number > 0 && 
      hole.par > 0 && 
      hole.handicapIndex > 0 &&
      Object.values(hole.distances).some(distance => distance > 0)
    );
    
    if (!isValid) {
      setError('Please ensure all holes have valid data');
      return;
    }
    
    // Submit the course
    submitCourse();
  };

  console.log('Rendering with holes:', holes);
  console.log('Tee sets:', teeSets);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Scorecard Details
      </Typography>
      
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
      
      {/* Debug display for hole data */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 3, mb: 3, maxHeight: '200px', overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Debug: Hole Data
          </Typography>
          <pre style={{ fontSize: '0.75rem' }}>
            {JSON.stringify(holes, null, 2)}
          </pre>
        </Paper>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Scorecard Image
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload an image of the scorecard to automatically extract hole details. The image should clearly show hole numbers, pars, handicap indexes, and distances for each tee.
        </Typography>
        
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
          {loading ? 'Extracting...' : 'Extract Hole Details'}
        </Button>
      </Paper>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Click on any cell to edit its value
        </Typography>
        
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hole</TableCell>
                <TableCell>Par</TableCell>
                <TableCell>Handicap</TableCell>
                {teeSets.map(teeSet => (
                  <TableCell key={teeSet.color}>{teeSet.color}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {holes.map((hole, index) => {
                console.log(`Rendering hole ${hole.number}:`, hole);
                return (
                  <TableRow key={hole.number}>
                    <TableCell>{hole.number}</TableCell>
                    <TableCell onClick={() => startEditing(index, 'par')}>
                      {editingCell && editingCell.holeIndex === index && editingCell.field === 'par' ? (
                        <TextField
                          autoFocus
                          variant="standard"
                          value={editValue}
                          onChange={handleCellValueChange}
                          onBlur={stopEditing}
                          onKeyDown={handleKeyDown}
                          type="number"
                          size="small"
                          sx={{ width: '60px' }}
                          InputProps={{ sx: { fontSize: '0.875rem' } }}
                        />
                      ) : (
                        hole.par
                      )}
                    </TableCell>
                    <TableCell onClick={() => startEditing(index, 'handicapIndex')}>
                      {editingCell && editingCell.holeIndex === index && editingCell.field === 'handicapIndex' ? (
                        <TextField
                          autoFocus
                          variant="standard"
                          value={editValue}
                          onChange={handleCellValueChange}
                          onBlur={stopEditing}
                          onKeyDown={handleKeyDown}
                          type="number"
                          size="small"
                          sx={{ width: '60px' }}
                          InputProps={{ sx: { fontSize: '0.875rem' } }}
                        />
                      ) : (
                        hole.handicapIndex
                      )}
                    </TableCell>
                    {teeSets.map(teeSet => {
                      // Get distance for this tee color
                      let distance = 0;
                      
                      if (hole.distances) {
                        // Try exact match first
                        if (teeSet.color in hole.distances) {
                          distance = parseInt(hole.distances[teeSet.color]) || 0;
                        } else {
                          // Try case-insensitive match
                          const keys = Object.keys(hole.distances);
                          const matchingKey = keys.find(key => key.toLowerCase() === teeSet.color.toLowerCase());
                          if (matchingKey) {
                            distance = parseInt(hole.distances[matchingKey]) || 0;
                          }
                        }
                      }
                      
                      return (
                        <TableCell key={teeSet.color} onClick={() => startEditing(index, 'distance', teeSet.color)}>
                          {editingCell && 
                           editingCell.holeIndex === index && 
                           editingCell.field === 'distance' && 
                           editingCell.teeColor === teeSet.color ? (
                            <TextField
                              autoFocus
                              variant="standard"
                              value={editValue}
                              onChange={handleCellValueChange}
                              onBlur={stopEditing}
                              onKeyDown={handleKeyDown}
                              type="number"
                              size="small"
                              sx={{ width: '60px' }}
                              InputProps={{ sx: { fontSize: '0.875rem' } }}
                            />
                          ) : (
                            distance
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell>
                  <strong>{holes.reduce((sum, hole) => sum + hole.par, 0)}</strong>
                </TableCell>
                <TableCell>-</TableCell>
                {teeSets.map(teeSet => (
                  <TableCell key={teeSet.color}>
                    <strong>
                      {holes.reduce((sum, hole) => {
                        if (!hole.distances) return sum;
                        
                        // Try exact match first
                        if (teeSet.color in hole.distances) {
                          return sum + (parseInt(hole.distances[teeSet.color]) || 0);
                        }
                        
                        // Try case-insensitive match
                        const keys = Object.keys(hole.distances);
                        const matchingKey = keys.find(key => key.toLowerCase() === teeSet.color.toLowerCase());
                        if (matchingKey) {
                          return sum + (parseInt(hole.distances[matchingKey]) || 0);
                        }
                        
                        return sum;
                      }, 0)}
                    </strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
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
          disabled={isSubmitting || holes.length === 0}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Course'}
        </Button>
      </Box>
    </Box>
  );
}
