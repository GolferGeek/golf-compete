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
    field: 'par' | 'handicap_index' | 'distance';
    teeColor?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [selectedTeeSet, setSelectedTeeSet] = useState<string | null>(null);
  
  const gridRef = useRef<HTMLTableElement>(null);
  
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
    
    // Parse the value, handling non-numeric input gracefully
    let newValue: number;
    
    if (field === 'par') {
      // Try to parse as number, default to 3 if not a valid number
      const parsedValue = parseInt(editValue.replace(/\D/g, ''));
      newValue = isNaN(parsedValue) ? 3 : parsedValue;
      // Ensure par is between 3 and 5
      newValue = Math.max(3, Math.min(5, newValue));
      
      // Update the hole
      const updatedHoles = [...holes];
      updatedHoles[holeIndex] = {
        ...updatedHoles[holeIndex],
        par: newValue
      };
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    } else if (field === 'handicap_index') {
      // Try to parse as number, default to 1 if not a valid number
      const parsedValue = parseInt(editValue.replace(/\D/g, ''));
      newValue = isNaN(parsedValue) ? 1 : parsedValue;
      // Ensure handicap index is between 1 and 18
      newValue = Math.max(1, Math.min(18, newValue));
      
      // Update the hole
      const updatedHoles = [...holes];
      updatedHoles[holeIndex] = {
        ...updatedHoles[holeIndex],
        handicap_index: newValue
      };
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    } else if (field === 'distance' && teeColor) {
      // Try to parse as number, default to 0 if not a valid number
      const parsedValue = parseInt(editValue.replace(/\D/g, ''));
      newValue = isNaN(parsedValue) ? 0 : parsedValue;
      // Ensure distance is non-negative
      newValue = Math.max(0, newValue);
      
      // Find the tee box
      const teeBox = teeBoxes.find(tb => tb.color === teeColor);
      
      if (teeBox) {
        // Update the hole
        const updatedHoles = [...holes];
        updatedHoles[holeIndex] = {
          ...updatedHoles[holeIndex],
          [`length_${teeBox.id}`]: newValue
        };
        
        setHoles(updatedHoles);
        setUnsavedChanges(true);
      }
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
      let nextField: 'par' | 'handicap_index' | 'distance' = field;
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
          
          nextField = 'distance';
          nextTeeColor = teeBoxes[teeBoxes.length - 1]?.color;
        } else if (field === 'handicap_index') {
          // Move from handicap to par of the same hole
          nextField = 'par';
        } else if (field === 'distance') {
          // Find current tee box index
          const currentTeeIndex = teeBoxes.findIndex(tb => tb.color === teeColor);
          
          if (currentTeeIndex > 0) {
            // Move to previous tee box distance for the same hole
            nextTeeColor = teeBoxes[currentTeeIndex - 1].color;
          } else {
            // Move to handicap of the same hole
            nextField = 'handicap_index';
            nextTeeColor = undefined;
          }
        }
      } else {
        // FORWARD NAVIGATION (TAB)
        if (field === 'par') {
          // Move from par to handicap
          nextField = 'handicap_index';
        } else if (field === 'handicap_index') {
          // Move from handicap to first tee box distance
          nextField = 'distance';
          nextTeeColor = teeBoxes[0]?.color;
        } else if (field === 'distance') {
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
  
  // Handle scorecard data extraction from AI
  const handleScorecardDataExtracted = (extractedData: any) => {
    if (!extractedData || !Array.isArray(extractedData) || extractedData.length === 0) {
      console.error('Invalid scorecard data format:', extractedData);
      return;
    }
    
    try {
      // Create a map of tee colors to tee box IDs
      const teeColorMap = teeBoxes.reduce((map, teeBox) => {
        map[teeBox.color.toLowerCase()] = teeBox.id;
        return map;
      }, {} as Record<string, string>);
      
      // Update holes with extracted data
      const updatedHoles = [...holes];
      
      extractedData.forEach((holeData, index) => {
        if (index >= updatedHoles.length) return;
        
        // Update par and handicap index if available
        if (holeData.par) {
          updatedHoles[index].par = parseInt(holeData.par) || 4;
        }
        
        if (holeData.handicapIndex) {
          updatedHoles[index].handicap_index = parseInt(holeData.handicapIndex) || index + 1;
        }
        
        // Update distances for each tee color
        if (holeData.distances) {
          Object.entries(holeData.distances).forEach(([color, distance]) => {
            const normalizedColor = color.toLowerCase();
            const teeBoxId = teeColorMap[normalizedColor];
            
            if (teeBoxId) {
              updatedHoles[index][`length_${teeBoxId}`] = parseInt(distance as string) || 0;
            }
          });
        }
      });
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    } catch (error) {
      console.error('Error processing extracted scorecard data:', error);
    }
  };
  
  // Save hole changes to the database
  const saveHoleChanges = async () => {
    if (!courseId) return;
    
    try {
      // Call the parent component's save function if available
      if (typeof handleSubmit === 'function') {
        await handleSubmit({} as any);
      }
      
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving hole changes:', error);
    }
  };

  // Render hole cards for mobile view
  const renderHoleCards = () => {
    if (!selectedTeeSet) return null;
    
    const selectedTee = teeBoxes.find(tee => tee.id === selectedTeeSet);
    if (!selectedTee) return null;
    
    return (
      <Box>
        <Grid container spacing={2}>
          {holes.map((hole, index) => (
            <Grid item xs={12} sm={6} md={4} key={`hole-card-${hole.number}`}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'primary.contrastText',
                    p: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="h6">Hole {hole.number}</Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Par</Typography>
                      <Box 
                        onClick={() => startEditing(index, 'par')}
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderRadius: 1,
                          px: 1,
                          minWidth: 30,
                          textAlign: 'center'
                        }}
                      >
                        {editingCell?.holeIndex === index && editingCell?.field === 'par' ? (
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            size="small"
                            inputProps={{ 
                              min: 3, 
                              max: 5, 
                              style: { 
                                padding: '2px', 
                                width: '30px', 
                                textAlign: 'center',
                                color: 'white'
                              } 
                            }}
                            sx={{ width: 40 }}
                          />
                        ) : (
                          hole.par
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>HCP</Typography>
                      <Box 
                        onClick={() => startEditing(index, 'handicap_index')}
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderRadius: 1,
                          px: 1,
                          minWidth: 30,
                          textAlign: 'center'
                        }}
                      >
                        {editingCell?.holeIndex === index && editingCell?.field === 'handicap_index' ? (
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            size="small"
                            inputProps={{ 
                              min: 1, 
                              max: 18, 
                              style: { 
                                padding: '2px', 
                                width: '30px', 
                                textAlign: 'center',
                                color: 'white'
                              } 
                            }}
                            sx={{ width: 40 }}
                          />
                        ) : (
                          hole.handicap_index
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Distances</Typography>
                  <Grid container spacing={1}>
                    {teeBoxes.map(teeBox => (
                      <Grid item xs={6} key={`distance-${hole.number}-${teeBox.id}`}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            p: 1,
                            borderRadius: 1,
                            bgcolor: teeBox.id === selectedTeeSet ? 'rgba(0,0,0,0.05)' : 'transparent',
                            border: teeBox.id === selectedTeeSet ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: teeBox.color,
                              border: '1px solid #ccc',
                              mr: 1
                            }} 
                          />
                          <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.8rem' }}>
                            {teeBox.name}
                          </Typography>
                          <Box 
                            onClick={() => startEditing(index, 'distance', teeBox.color)}
                            sx={{ 
                              cursor: 'pointer',
                              bgcolor: 'rgba(0,0,0,0.05)',
                              borderRadius: 1,
                              px: 1,
                              minWidth: 40,
                              textAlign: 'center'
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
                                inputProps={{ 
                                  min: 0, 
                                  style: { 
                                    padding: '2px', 
                                    width: '50px', 
                                    textAlign: 'center',
                                    color: 'white'
                                  } 
                                }}
                                sx={{ width: 60 }}
                              />
                            ) : (
                              hole[`length_${teeBox.id}`] || 0
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render the front 9 and back 9 holes in a compact table
  const renderCompactTable = (teeSet: TeeSet, holeStart: number, holeEnd: number) => {
    const holesSubset = holes.slice(holeStart - 1, holeEnd);
    
    return (
      <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hole</TableCell>
              {holesSubset.map(hole => (
                <TableCell key={`hole-${hole.number}`} align="center">{hole.number}</TableCell>
              ))}
              <TableCell align="center">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Par</TableCell>
              {holesSubset.map((hole, index) => (
                <TableCell 
                  key={`par-${hole.number}`} 
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
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {holesSubset.reduce((sum, hole) => sum + hole.par, 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  '& .color-dot': {
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: teeSet.color,
                    border: '1px solid #ccc',
                    mr: 1
                  }
                }}>
                  <span className="color-dot" />
                  {isSmallScreen ? '' : teeSet.name}
                </Box>
              </TableCell>
              {holesSubset.map((hole, index) => (
                <TableCell 
                  key={`distance-${hole.number}-${teeSet.id}`} 
                  align="center"
                  onClick={() => startEditing(holeStart - 1 + index, 'distance', teeSet.color)}
                  sx={{ 
                    cursor: 'pointer', 
                    backgroundColor: editingCell?.holeIndex === (holeStart - 1 + index) && 
                                    editingCell?.field === 'distance' && 
                                    editingCell?.teeColor === teeSet.color ? '#f5f5f5' : 'inherit'
                  }}
                >
                  {editingCell?.holeIndex === (holeStart - 1 + index) && 
                   editingCell?.field === 'distance' && 
                   editingCell?.teeColor === teeSet.color ? (
                    <TextField
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyPress}
                      autoFocus
                      size="small"
                      inputProps={{ 
                        min: 0, 
                        style: { padding: '2px', textAlign: 'center' } 
                      }}
                      sx={{ width: 60 }}
                    />
                  ) : (
                    hole[`length_${teeSet.id}`] || 0
                  )}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {holesSubset.reduce((sum, hole) => sum + (hole[`length_${teeSet.id}`] || 0), 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>HCP</TableCell>
              {holesSubset.map((hole, index) => (
                <TableCell 
                  key={`handicap-${hole.number}`} 
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
              ))}
              <TableCell align="center">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render the mobile view with tabs for each tee set
  const renderMobileView = () => {
    return (
      <Box>
        {/* Tee set selector tabs */}
        <Tabs
          value={selectedTeeSet || ''}
          onChange={(_, newValue) => setSelectedTeeSet(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          {teeBoxes.map(teeBox => (
            <Tab 
              key={teeBox.id} 
              value={teeBox.id} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: teeBox.color,
                      border: '1px solid #ccc',
                      mr: 1
                    }} 
                  />
                  {teeBox.name}
                </Box>
              }
            />
          ))}
        </Tabs>

        {/* Selected tee set data */}
        {selectedTeeSet && (
          <Box>
            {/* Use the new card-based layout for holes */}
            {renderHoleCards()}
            
            {/* Course totals */}
            {teeBoxes.map(teeBox => (
              teeBox.id === selectedTeeSet && (
                <Box key={teeBox.id} sx={{ mt: 3 }}>
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Course Totals for {teeBox.name}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={4}>
                        <Typography variant="body2">Total Par:</Typography>
                        <Typography variant="h6">{holes.reduce((sum, hole) => sum + hole.par, 0)}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">Total Length:</Typography>
                        <Typography variant="h6">{holes.reduce((sum, hole) => sum + (hole[`length_${teeBox.id}`] || 0), 0)} yards</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">Rating/Slope:</Typography>
                        <Typography variant="h6">{teeBox.rating}/{teeBox.slope}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Render the desktop view with all tee sets in a single table
  const renderDesktopView = () => {
    return (
      <TableContainer component={Paper} sx={{ mb: 3, overflowX: 'auto' }} ref={gridRef}>
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
                        inputProps={{ 
                          min: 0, 
                          style: { padding: '2px', textAlign: 'center' } 
                        }}
                        sx={{ width: 60 }}
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
    );
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
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
            isMobile={isMobile}
          />

          <Box sx={{ 
            display: 'flex', 
            flexDirection: isSmallScreen ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isSmallScreen ? 'flex-start' : 'center',
            mb: 3 
          }}>
            <Typography variant="h6">Scorecard Data</Typography>
            {unsavedChanges && (
              <Button 
                variant="contained" 
                color="primary"
                onClick={saveHoleChanges}
                sx={{ mt: isSmallScreen ? 1 : 0 }}
                fullWidth={isSmallScreen}
              >
                Save Changes
              </Button>
            )}
          </Box>
          
          {holes.length > 0 ? (
            isSmallScreen ? renderMobileView() : renderDesktopView()
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No holes data available. Please generate holes or use the AI extraction tool above.
            </Typography>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isSmallScreen ? 'column' : 'row',
            justifyContent: 'space-between', 
            mt: 4 
          }}>
            <Button 
              onClick={handleBack} 
              disabled={loading}
              fullWidth={isSmallScreen}
              sx={{ mb: isSmallScreen ? 1 : 0 }}
            >
              Back
            </Button>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isSmallScreen ? 'column' : 'row',
              width: isSmallScreen ? '100%' : 'auto'
            }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/admin/courses';
                }}
                sx={{ mr: isSmallScreen ? 0 : 1, mb: isSmallScreen ? 1 : 0 }}
                disabled={loading}
                fullWidth={isSmallScreen}
              >
                Exit Without Saving
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={async (e) => {
                  if (handleSubmit) {
                    await saveHoleChanges();
                    await handleSubmit(e as any);
                    // Redirect to courses list after successful save
                    window.location.href = '/admin/courses';
                  }
                }}
                disabled={loading}
                fullWidth={isSmallScreen}
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