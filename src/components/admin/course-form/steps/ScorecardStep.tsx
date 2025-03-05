import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography,
  TextField,
  IconButton,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { ScorecardStepProps, Hole, TeeSet } from '../types';
import ImageUploader from '../components/ImageUploader';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';

const ScorecardStep: React.FC<ScorecardStepProps> = ({
  courseId,
  teeBoxes,
  holes,
  setHoles,
  handleSubmit,
  handleBack,
  loading,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep,
  isMobile
}) => {
  const theme = useTheme();
  const isSmallScreen = isMobile || useMediaQuery(theme.breakpoints.down('md'));
  const [editingCell, setEditingCell] = useState<{
    holeIndex: number;
    field: 'par' | 'handicap_index' | 'notes';
    teeColor?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [selectedTeeSet, setSelectedTeeSet] = useState<string | null>(null);
  
  const gridRef = useRef<HTMLTableElement>(null);
  const router = useRouter();
  
  // Generate empty holes if none exist
  useEffect(() => {
    if (courseId && holes.length === 0) {
      generateEmptyHoles();
    }
  }, [courseId]);
  
  // Set the first tee set as selected by default
  useEffect(() => {
    if (teeBoxes.length > 0 && !selectedTeeSet) {
      setSelectedTeeSet(teeBoxes[0].id);
    }
  }, [teeBoxes]);
  
  // Create 18 empty holes
  const generateEmptyHoles = () => {
    if (!courseId) return;
    
    const newHoles: Hole[] = [];
    
    for (let i = 1; i <= 18; i++) {
      newHoles.push({
        id: undefined,
        course_id: courseId,
        number: i,
        par: 4, // Default par
        handicap_index: i // Default handicap index
      });
    }
    
    setHoles(newHoles);
    setUnsavedChanges(true);
  };
  
  // Start editing a cell
  const startEditing = (holeIndex: number, field: 'par' | 'handicap_index' | 'notes', teeColor?: string) => {
    let value = '';
    
    const hole = holes[holeIndex];
    
    if (field === 'par') {
      value = hole.par.toString();
    } else if (field === 'handicap_index') {
      value = hole.handicap_index.toString();
    } else if (field === 'notes') {
      value = hole.notes || '';
    }
    
    console.log(`Starting editing for hole ${hole.number}, field: ${field}, current value: ${value}`);
    
    setEditingCell({ holeIndex, field, teeColor });
    setEditValue(value);
  };
  
  // Stop editing and save the value
  const stopEditing = () => {
    if (!editingCell) return;
    
    const { holeIndex, field, teeColor } = editingCell;
    
    // Parse the value, handling non-numeric input gracefully
    let newValue: number | string;
    
    if (field === 'par' || field === 'handicap_index') {
      newValue = parseInt(editValue) || 0;
      if (newValue < 0) newValue = 0;
      if (field === 'par' && newValue > 10) newValue = 10;
      if (field === 'handicap_index' && newValue > 18) newValue = 18;
    } else {
      // For notes or other text fields
      newValue = editValue;
    }
    
    console.log(`Stopping editing for hole ${holes[holeIndex].number}, field: ${field}, new value: ${newValue}`);
    
    // Update the appropriate field
    if (field === 'par') {
      const updatedHoles = [...holes];
      updatedHoles[holeIndex] = {
        ...updatedHoles[holeIndex],
        par: newValue as number
      };
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    } else if (field === 'handicap_index') {
      const updatedHoles = [...holes];
      updatedHoles[holeIndex] = {
        ...updatedHoles[holeIndex],
        handicap_index: newValue as number
      };
      
      console.log(`Updated handicap_index for hole ${updatedHoles[holeIndex].number} to ${newValue}`);
      console.log('Updated hole object:', updatedHoles[holeIndex]);
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    } else if (field === 'notes') {
      const updatedHoles = [...holes];
      updatedHoles[holeIndex] = {
        ...updatedHoles[holeIndex],
        notes: newValue as string
      };
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    }
    
    setEditingCell(null);
  };
  
  // Handle key press events in the edit field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      stopEditing();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault(); // Prevent default tab behavior
      
      if (!editingCell) return;
      
      const { holeIndex, field, teeColor } = editingCell;
      
      // Save current field
      stopEditing();
      
      // Determine next field to edit based on shift key (backward or forward)
      let nextHoleIndex = holeIndex;
      let nextField: 'par' | 'handicap_index' | 'notes' = field;
      let nextTeeColor = teeColor;
      
      if (e.shiftKey) {
        // BACKWARD NAVIGATION (SHIFT+TAB)
        if (field === 'par') {
          // Move from par to the last tee box distance of the previous hole
          nextHoleIndex = holeIndex - 1;
          
          // If we've reached the beginning of holes, wrap to the last hole
          if (nextHoleIndex < 0) {
            nextHoleIndex = holes.length - 1;
          }
          
          nextField = 'notes';
          nextTeeColor = teeBoxes[teeBoxes.length - 1]?.color;
        } else if (field === 'handicap_index') {
          // Move from handicap_index to par of the same hole
          nextField = 'par';
        } else if (field === 'notes') {
          // Find current tee box index
          const currentTeeIndex = teeBoxes.findIndex(tb => tb.color === teeColor);
          
          if (currentTeeIndex > 0) {
            // Move to previous tee box distance for the same hole
            nextTeeColor = teeBoxes[currentTeeIndex - 1].color;
          } else {
            // Move to handicap_index of the same hole
            nextField = 'handicap_index';
            nextTeeColor = undefined;
          }
        }
      } else {
        // FORWARD NAVIGATION (TAB)
        if (field === 'par') {
          // Move from par to handicap_index
          nextField = 'handicap_index';
        } else if (field === 'handicap_index') {
          // Move from handicap_index to first tee box distance
          nextField = 'notes';
          nextTeeColor = teeBoxes[0]?.color;
        } else if (field === 'notes') {
          // Find current tee box index
          const currentTeeIndex = teeBoxes.findIndex(tb => tb.color === teeColor);
          
          if (currentTeeIndex < teeBoxes.length - 1) {
            // Move to next tee box distance for the same hole
            nextTeeColor = teeBoxes[currentTeeIndex + 1].color;
          } else {
            // Move to next hole's par
            nextHoleIndex = holeIndex + 1;
            
            // If we've reached the end of holes, wrap to the first hole
            if (nextHoleIndex >= holes.length) {
              nextHoleIndex = 0;
            }
            
            nextField = 'par';
            nextTeeColor = undefined;
          }
        }
      }
      
      // Start editing the next field
      setTimeout(() => {
        startEditing(nextHoleIndex, nextField, nextTeeColor);
      }, 10);
    }
  };
  
  // Handle data extracted from AI
  const handleScorecardDataExtracted = (extractedData: any) => {
    console.log('Scorecard data extracted:', extractedData);
    
    // For now, just log the data
    // In a real implementation, we would update the holes state with this data
  };
  
  // Save hole changes to the database
  const saveHoleChanges = async () => {
    if (!courseId) return;
    
    console.log('saveHoleChanges called - Attempting to save hole changes');
    console.log('Current holes data:', holes);
    
    if (!unsavedChanges) {
      console.log('No unsaved changes detected, skipping save');
      return;
    }
    
    try {
      console.log('Proceeding with save');
      
      // Call the parent component's save function if available
      if (typeof handleSubmit === 'function') {
        console.log('Calling parent handleSubmit function');
        await handleSubmit({} as any);
        console.log('Parent handleSubmit function completed');
      } else {
        console.log('No parent handleSubmit function available');
      }
      
      console.log('Scorecard saved successfully');
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving scorecard:', error);
    }
  };

  // Render the scorecard table
  const renderScorecardTable = (holeStart: number, holeEnd: number) => {
    const holesSubset = holes.slice(holeStart - 1, holeEnd);
    
    return (
      <TableContainer component={Paper} sx={{ mb: 4, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hole</TableCell>
              <TableCell align="center">Par</TableCell>
              <TableCell align="center">HCP</TableCell>
              {teeBoxes.map(teeBox => (
                <TableCell key={teeBox.id} align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        backgroundColor: teeBox.color,
                        border: '1px solid #ccc',
                        mr: 1,
                        // Add a darker border for white tee boxes to make them visible
                        borderColor: teeBox.color.toLowerCase() === 'white' ? '#999' : '#ccc',
                      }} 
                    />
                    <Typography variant="body2" sx={{ 
                      // Ensure text is visible regardless of tee color
                      color: 'text.primary'
                    }}>
                      {teeBox.name}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
              <TableCell align="center">Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holesSubset.map((hole, index) => (
              <TableRow key={`hole-${hole.number}`}>
                <TableCell>{hole.number}</TableCell>
                <TableCell 
                  align="center"
                  onClick={() => startEditing(holeStart - 1 + index, 'par')}
                  sx={{ 
                    cursor: 'pointer', 
                    backgroundColor: editingCell?.holeIndex === (holeStart - 1 + index) && 
                                   editingCell?.field === 'par' ? '#f5f5f5' : 'inherit'
                  }}
                >
                  {editingCell?.holeIndex === (holeStart - 1 + index) && editingCell?.field === 'par' ? (
                    <TextField
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyPress}
                      autoFocus
                      size="small"
                      inputProps={{ 
                        min: 3, 
                        max: 5, 
                        style: { padding: '2px', textAlign: 'center' } 
                      }}
                      sx={{ width: 40 }}
                    />
                  ) : (
                    hole.par
                  )}
                </TableCell>
                <TableCell 
                  align="center"
                  onClick={() => startEditing(holeStart - 1 + index, 'handicap_index')}
                  sx={{ 
                    cursor: 'pointer', 
                    backgroundColor: editingCell?.holeIndex === (holeStart - 1 + index) && 
                                   editingCell?.field === 'handicap_index' ? '#f5f5f5' : 'inherit'
                  }}
                >
                  {editingCell?.holeIndex === (holeStart - 1 + index) && editingCell?.field === 'handicap_index' ? (
                    <TextField
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyPress}
                      autoFocus
                      size="small"
                      inputProps={{ 
                        min: 1, 
                        max: 18, 
                        style: { padding: '2px', textAlign: 'center' } 
                      }}
                      sx={{ width: 40 }}
                    />
                  ) : (
                    hole.handicap_index
                  )}
                </TableCell>
                {teeBoxes.map(teeBox => (
                  <TableCell 
                    key={`${hole.number}-${teeBox.id}`}
                    align="center"
                    sx={{ 
                      cursor: 'default',
                      // Add a subtle background color matching the tee color (with low opacity)
                      backgroundColor: teeBox.color.toLowerCase() === 'white' ? 'rgba(0,0,0,0.03)' : `${teeBox.color}10`
                    }}
                  >
                    {/* We don't edit distances anymore, just display the tee color */}
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: teeBox.color,
                        border: '1px solid #ccc',
                        // Add a darker border for white tee boxes to make them visible
                        borderColor: teeBox.color.toLowerCase() === 'white' ? '#999' : '#ccc',
                        margin: '0 auto'
                      }} 
                    />
                  </TableCell>
                ))}
                <TableCell 
                  align="center"
                  onClick={() => startEditing(holeStart - 1 + index, 'notes')}
                  sx={{ 
                    cursor: 'pointer', 
                    backgroundColor: editingCell?.holeIndex === (holeStart - 1 + index) && 
                                   editingCell?.field === 'notes' ? '#f5f5f5' : 'inherit'
                  }}
                >
                  {editingCell?.holeIndex === (holeStart - 1 + index) && editingCell?.field === 'notes' ? (
                    <TextField
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={stopEditing}
                      onKeyDown={handleKeyPress}
                      autoFocus
                      size="small"
                      inputProps={{ 
                        style: { padding: '2px', textAlign: 'center' } 
                      }}
                      sx={{ width: 120 }}
                    />
                  ) : (
                    hole.notes || ''
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {holesSubset.reduce((sum, hole) => sum + hole.par, 0)}
              </TableCell>
              <TableCell align="center">-</TableCell>
              {teeBoxes.map(teeBox => (
                <TableCell key={`total-${teeBox.id}`} align="center">-</TableCell>
              ))}
              <TableCell align="center">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      {courseId && teeBoxes.length > 0 ? (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Scorecard Editor
            </Typography>
            <Typography variant="body1" paragraph>
              Edit the scorecard details below. Click on any value to edit it.
            </Typography>
          </Box>

          {/* Scorecard Tables */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Front Nine
            </Typography>
            {renderScorecardTable(1, 9)}
            
            <Typography variant="h6" gutterBottom>
              Back Nine
            </Typography>
            {renderScorecardTable(10, 18)}
            
            <Typography variant="h6" gutterBottom>
              Course Totals
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell align="center">Par</TableCell>
                    {teeBoxes.map(teeBox => (
                      <TableCell key={teeBox.id} align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              backgroundColor: teeBox.color,
                              border: '1px solid #ccc',
                              mr: 1,
                              // Add a darker border for white tee boxes to make them visible
                              borderColor: teeBox.color.toLowerCase() === 'white' ? '#999' : '#ccc',
                            }} 
                          />
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {teeBox.name}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Front 9</TableCell>
                    <TableCell align="center">
                      {holes.slice(0, 9).reduce((sum, hole) => sum + hole.par, 0)}
                    </TableCell>
                    {teeBoxes.map(teeBox => (
                      <TableCell key={`front9-${teeBox.id}`} align="center">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          // Add a subtle background color matching the tee color (with low opacity)
                          backgroundColor: teeBox.color.toLowerCase() === 'white' ? 'rgba(0,0,0,0.03)' : `${teeBox.color}10`,
                          borderRadius: '4px',
                          padding: '2px 8px'
                        }}>
                          <Typography variant="body2">
                            {teeBox.rating}/{teeBox.slope}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Back 9</TableCell>
                    <TableCell align="center">
                      {holes.slice(9, 18).reduce((sum, hole) => sum + hole.par, 0)}
                    </TableCell>
                    {teeBoxes.map(teeBox => (
                      <TableCell key={`back9-${teeBox.id}`} align="center">
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          // Add a subtle background color matching the tee color (with low opacity)
                          backgroundColor: teeBox.color.toLowerCase() === 'white' ? 'rgba(0,0,0,0.03)' : `${teeBox.color}10`,
                          borderRadius: '4px',
                          padding: '2px 8px'
                        }}>
                          <Typography variant="body2">
                            {teeBox.rating}/{teeBox.slope}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                      {holes.reduce((sum, hole) => sum + hole.par, 0)}
                    </TableCell>
                    {teeBoxes.map(teeBox => (
                      <TableCell key={`total-${teeBox.id}`} align="center" sx={{ fontWeight: 'bold' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          // Add a subtle background color matching the tee color (with low opacity)
                          backgroundColor: teeBox.color.toLowerCase() === 'white' ? 'rgba(0,0,0,0.03)' : `${teeBox.color}10`,
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontWeight: 'bold'
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {teeBox.rating}/{teeBox.slope}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {handleBack && (
              <Button 
                variant="outlined" 
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
              >
                Back to Tee Boxes
              </Button>
            )}
            
            <Button 
              variant="contained" 
              color="primary"
              onClick={saveHoleChanges}
              disabled={loading || processingImage}
              endIcon={<SaveIcon />}
            >
              {loading ? 'Saving...' : 'Save Scorecard'}
            </Button>
          </Box>

          {/* Image Uploader */}
          {!isSmallScreen && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Extract Scorecard from Image
              </Typography>
              <ImageUploader
                step="scorecard"
                processingImage={processingImage}
                setProcessingImage={setProcessingImage}
                extractionStep={extractionStep}
                setExtractionStep={setExtractionStep}
                onDataExtracted={handleScorecardDataExtracted}
                isMobile={isMobile}
              />
            </Box>
          )}

          {/* Save & Return Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                await saveHoleChanges();
                if (typeof handleSubmit === 'function') {
                  await handleSubmit({} as any);
                }
                router.push('/admin/courses');
              }}
              disabled={loading || processingImage}
              sx={{
                px: { xs: 2, sm: 4 },
                py: 1.5,
                borderRadius: 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {loading ? 'Saving...' : 'Save Scorecard & Return to List'}
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            No Course or Tee Boxes Found
          </Typography>
          <Typography variant="body1" paragraph>
            Please create a course and add tee boxes first before editing the scorecard.
          </Typography>
          {handleBack && (
            <Button 
              variant="contained" 
              onClick={handleBack}
            >
              Go Back to Tee Boxes
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ScorecardStep; 