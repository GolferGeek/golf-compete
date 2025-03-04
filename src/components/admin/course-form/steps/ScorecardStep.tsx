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
  IconButton
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { ScorecardStepProps, Hole } from '../types';
import ImageUploader from '../components/ImageUploader';

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
  setExtractionStep
}) => {
  const [editingCell, setEditingCell] = useState<{
    holeIndex: number;
    field: 'par' | 'handicap_index' | 'distance';
    teeColor?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  
  const gridRef = useRef<HTMLTableElement>(null);
  
  // Generate empty holes if none exist
  useEffect(() => {
    if (courseId && holes.length === 0) {
      generateEmptyHoles();
    }
  }, [courseId]);
  
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
  const startEditing = (holeIndex: number, field: 'par' | 'handicap_index' | 'distance', teeColor?: string) => {
    const hole = holes[holeIndex];
    
    if (!hole) return;
    
    let value = '';
    
    if (field === 'par') {
      value = hole.par.toString();
    } else if (field === 'handicap_index') {
      value = hole.handicap_index.toString();
    } else if (field === 'distance' && teeColor) {
      const teeBox = teeBoxes.find(tb => tb.color === teeColor);
      if (teeBox) {
        value = (hole[`length_${teeBox.id}`] || '0').toString();
      }
    }
    
    setEditingCell({ holeIndex, field, teeColor });
    setEditValue(value);
  };
  
  // Stop editing and save the value
  const stopEditing = () => {
    if (!editingCell) return;
    
    const { holeIndex, field, teeColor } = editingCell;
    
    // Parse the value as an integer, with appropriate defaults
    let newValue: number;
    if (editValue === '') {
      // Use appropriate defaults for empty values
      if (field === 'par') {
        newValue = 4; // Default par
      } else if (field === 'handicap_index') {
        newValue = holeIndex + 1; // Default handicap index
      } else {
        newValue = 0; // Default distance
      }
    } else {
      newValue = parseInt(editValue, 10);
      
      // Apply min/max constraints
      if (field === 'par') {
        newValue = Math.max(1, Math.min(10, newValue)); // Par between 1 and 10
      } else if (field === 'handicap_index') {
        newValue = Math.max(1, Math.min(18, newValue)); // Handicap between 1 and 18
      } else if (field === 'distance') {
        newValue = Math.max(1, Math.min(999, newValue)); // Distance between 1 and 999
      }
    }
    
    // Update the hole data
    const updatedHoles = [...holes];
    const hole = { ...updatedHoles[holeIndex] };
    let valueChanged = false;
    
    if (field === 'par') {
      if (hole.par !== newValue) {
        hole.par = newValue;
        valueChanged = true;
      }
    } else if (field === 'handicap_index') {
      if (hole.handicap_index !== newValue) {
        hole.handicap_index = newValue;
        valueChanged = true;
      }
    } else if (field === 'distance' && teeColor) {
      // Find the tee box
      const teeBox = teeBoxes.find(tb => tb.color === teeColor);
      if (teeBox) {
        const key = `length_${teeBox.id}`;
        if (hole[key] !== newValue) {
          hole[key] = newValue;
          valueChanged = true;
        }
      }
    }
    
    if (valueChanged) {
      updatedHoles[holeIndex] = hole;
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    }
    
    setEditingCell(null);
    setEditValue('');
  };
  
  // Handle key press in the edit field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!editingCell) return;
    
    const { holeIndex, field, teeColor } = editingCell;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      stopEditing();
      return;
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      stopEditing();
      
      if (e.shiftKey) {
        // Tab backwards
        if (field === 'par') {
          // From par, go to the last tee box of previous row
          if (holeIndex > 0 && teeBoxes.length > 0) {
            startEditing(holeIndex - 1, 'distance', teeBoxes[teeBoxes.length - 1].color);
          } else {
            // At the start, loop to the last cell
            startEditing(holes.length - 1, 'distance', teeBoxes[teeBoxes.length - 1].color);
          }
        } else if (field === 'handicap_index') {
          // From handicap, go to par
          startEditing(holeIndex, 'par');
        } else if (field === 'distance' && teeColor) {
          // Find current tee box index
          const currentTeeIndex = teeBoxes.findIndex(tb => tb.color === teeColor);
          
          if (currentTeeIndex > 0) {
            // Go to previous tee box
            startEditing(holeIndex, 'distance', teeBoxes[currentTeeIndex - 1].color);
          } else {
            // Go to handicap
            startEditing(holeIndex, 'handicap_index');
          }
        }
      } else {
        // Tab forwards
        if (field === 'par') {
          // Move from par to handicap
          startEditing(holeIndex, 'handicap_index');
        } else if (field === 'handicap_index') {
          // Move from handicap to first tee box
          if (teeBoxes.length > 0) {
            startEditing(holeIndex, 'distance', teeBoxes[0].color);
          } else {
            // No tee boxes, go to next row
            if (holeIndex < holes.length - 1) {
              startEditing(holeIndex + 1, 'par');
            } else {
              // At the end, loop back to first cell
              startEditing(0, 'par');
            }
          }
        } else if (field === 'distance' && teeColor) {
          // Find current tee box index
          const currentTeeIndex = teeBoxes.findIndex(tb => tb.color === teeColor);
          
          if (currentTeeIndex < teeBoxes.length - 1) {
            // Go to next tee box
            startEditing(holeIndex, 'distance', teeBoxes[currentTeeIndex + 1].color);
          } else {
            // Last tee box, go to next row
            if (holeIndex < holes.length - 1) {
              startEditing(holeIndex + 1, 'par');
            } else {
              // At the end, loop back to first cell
              startEditing(0, 'par');
            }
          }
        }
      }
      return;
    }
  };
  
  // Handle click outside to stop editing
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (editingCell && gridRef.current) {
      const target = e.target as Node;
      if (!gridRef.current.contains(target)) {
        stopEditing();
      }
    }
  }, [editingCell]);

  useEffect(() => {
    // Add event listener when editing starts
    if (editingCell) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCell, handleClickOutside]);
  
  // Generate handicap indexes based on hole difficulty
  const generateHandicapIndexes = () => {
    if (holes.length === 0) return;
    
    // Create a copy of the holes array
    const updatedHoles = [...holes];
    
    // Sort holes by difficulty (par and length)
    const sortedHoleIndexes = updatedHoles.map((hole, index) => ({
      index,
      difficulty: hole.par + (teeBoxes.length > 0 && hole[`length_${teeBoxes[0].id}`] ? hole[`length_${teeBoxes[0].id}`] / 100 : 0)
    }))
    .sort((a, b) => b.difficulty - a.difficulty); // Sort by difficulty (descending)
    
    // Assign handicap indexes (1-18) based on difficulty
    sortedHoleIndexes.forEach((item, i) => {
      updatedHoles[item.index].handicap_index = i + 1;
    });
    
    setHoles(updatedHoles);
    setUnsavedChanges(true);
  };
  
  // Handle image extraction data
  const handleScorecardDataExtracted = (extractedData: any) => {
    if (Array.isArray(extractedData)) {
      // Generate holes if they don't exist
      if (holes.length === 0) {
        generateEmptyHoles();
      }
      
      // Map the extracted hole data to our hole structure
      const updatedHoles = extractedData.map((extractedHole: any, index: number) => {
        // Find existing hole or create a new one
        const existingHole = holes.find(h => h.number === extractedHole.number) || {
          id: uuidv4(),
          number: extractedHole.number,
          par: 4,
          handicap_index: index + 1
        };
        
        // Update hole data
        const updatedHole = {
          ...existingHole,
          par: extractedHole.par || existingHole.par,
          handicap_index: extractedHole.handicapIndex || existingHole.handicap_index
        };
        
        // Add distances for each tee box
        if (extractedHole.distances) {
          teeBoxes.forEach(teeBox => {
            const teeColor = teeBox.color;
            if (extractedHole.distances[teeColor]) {
              updatedHole[`length_${teeBox.id}`] = extractedHole.distances[teeColor];
            }
          });
        }
        
        return updatedHole;
      });
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    }
  };
  
  // Save hole changes to the database
  const saveHoleChanges = async () => {
    if (!courseId || holes.length === 0) return;
    
    try {
      // Call the submit handler to save the data
      const event = new Event('submit') as any;
      await handleSubmit(event);
      
      // Reset the unsaved changes flag
      setUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving hole data:', err);
      alert('Error saving scorecard data. Please try again');
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      {courseId && teeBoxes.length > 0 ? (
        <Box>
          {/* AI-Assisted Data Extraction Card */}
          <ImageUploader
            step="scorecard"
            processingImage={processingImage}
            setProcessingImage={setProcessingImage}
            extractionStep={extractionStep}
            setExtractionStep={setExtractionStep}
            onDataExtracted={handleScorecardDataExtracted}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Scorecard Data</Typography>
            <Box>
              <Button 
                variant="outlined" 
                onClick={generateHandicapIndexes}
                sx={{ mr: 1 }}
              >
                Auto-Generate Handicap Indexes
              </Button>
              {unsavedChanges && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={saveHoleChanges}
                >
                  Save Changes
                </Button>
              )}
            </Box>
          </Box>
          
          {holes.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 3 }} ref={gridRef}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hole</TableCell>
                    <TableCell>Par</TableCell>
                    <TableCell>Handicap</TableCell>
                    {teeBoxes.map(teeBox => (
                      <TableCell key={teeBox.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              backgroundColor: teeBox.color,
                              border: '1px solid #ccc',
                              mr: 1
                            }} 
                          />
                          {teeBox.name}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holes.map((hole, index) => (
                    <TableRow key={hole.id || `hole-${index}`}>
                      <TableCell>{hole.number}</TableCell>
                      <TableCell 
                        onClick={() => startEditing(index, 'par')}
                        sx={{ 
                          cursor: 'pointer', 
                          backgroundColor: editingCell?.holeIndex === index && editingCell?.field === 'par' ? '#f5f5f5' : 'inherit'
                        }}
                      >
                        {editingCell?.holeIndex === index && editingCell?.field === 'par' ? (
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            size="small"
                            type="number"
                            inputProps={{ min: 1, max: 10, style: { padding: '4px', width: '40px' } }}
                          />
                        ) : (
                          hole.par
                        )}
                      </TableCell>
                      <TableCell 
                        onClick={() => startEditing(index, 'handicap_index')}
                        sx={{ 
                          cursor: 'pointer', 
                          backgroundColor: editingCell?.holeIndex === index && editingCell?.field === 'handicap_index' ? '#f5f5f5' : 'inherit'
                        }}
                      >
                        {editingCell?.holeIndex === index && editingCell?.field === 'handicap_index' ? (
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            size="small"
                            type="number"
                            inputProps={{ min: 1, max: 18, style: { padding: '4px', width: '40px' } }}
                          />
                        ) : (
                          hole.handicap_index
                        )}
                      </TableCell>
                      {teeBoxes.map(teeBox => (
                        <TableCell 
                          key={`${hole.id || index}-${teeBox.id}`}
                          onClick={() => startEditing(index, 'distance', teeBox.color)}
                          sx={{ 
                            cursor: 'pointer', 
                            backgroundColor: editingCell?.holeIndex === index && 
                                            editingCell?.field === 'distance' && 
                                            editingCell?.teeColor === teeBox.color ? '#f5f5f5' : 'inherit'
                          }}
                        >
                          {editingCell?.holeIndex === index && 
                           editingCell?.field === 'distance' && 
                           editingCell?.teeColor === teeBox.color ? (
                            <TextField
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              autoFocus
                              size="small"
                              type="number"
                              inputProps={{ min: 1, max: 999, style: { padding: '4px', width: '40px' } }}
                            />
                          ) : (
                            hole[`length_${teeBox.id}`] || 0
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    <TableCell>Total</TableCell>
                    <TableCell>
                      {holes.reduce((sum, hole) => sum + hole.par, 0)}
                    </TableCell>
                    <TableCell>-</TableCell>
                    {teeBoxes.map(teeBox => (
                      <TableCell key={`total-${teeBox.id}`}>
                        {holes.reduce((sum, hole) => sum + (hole[`length_${teeBox.id}`] || 0), 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No holes data available. Please generate holes or use the AI extraction tool above.
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBack} disabled={loading}>
              Back
            </Button>
            <Box>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => window.location.href = '/admin/courses'}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Exit Without Saving
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={(e) => handleSubmit(e as any)}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save and Finish'}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {!courseId ? 'No Course ID Found' : 'No Tee Boxes Defined'}
          </Typography>
          <Typography variant="body1" paragraph>
            {!courseId 
              ? 'Please save the course information first before adding scorecard data.'
              : 'Please add tee boxes before entering scorecard data.'}
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Go Back
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ScorecardStep; 