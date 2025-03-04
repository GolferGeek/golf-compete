"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';

export interface TeeSet {
  id: string;
  name: string;
  color: string;
  rating?: number;
  slope?: number;
}

export interface HoleData {
  id?: string;
  number: number;
  par: number;
  handicapIndex: number;
  distances: Record<string, number>;
}

export interface ScorecardEditorProps {
  courseId: string;
  teeSets: TeeSet[];
  holes: HoleData[];
  onSave: (holes: HoleData[]) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

export default function ScorecardEditor({
  courseId,
  teeSets,
  holes,
  onSave,
  onCancel,
  loading = false,
  readOnly = false
}: ScorecardEditorProps) {
  const [localHoles, setLocalHoles] = useState<HoleData[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    holeIndex: number;
    field: 'par' | 'handicapIndex' | 'distance';
    teeColor?: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Initialize local holes from props
  useEffect(() => {
    if (holes.length > 0) {
      setLocalHoles([...holes]);
    } else {
      // Create default 18 holes if none provided
      const defaultHoles = Array.from({ length: 18 }, (_, i) => {
        // Create distances object with explicit values for each tee set
        const distances: Record<string, number> = {};
        
        // Add each tee set with a default distance of 0
        teeSets.forEach(teeSet => {
          distances[teeSet.id] = 0;
        });
        
        return {
          number: i + 1,
          par: 4,
          handicapIndex: i + 1,
          distances: distances
        };
      });
      
      setLocalHoles(defaultHoles);
    }
  }, [holes, teeSets]);

  const handleParChange = (index: number, value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    const numValue = value === '' ? 0 : parseInt(value, 10);
    
    // Validate range
    if (numValue > 0) {
      setLocalHoles(prev => {
        const newHoles = [...prev];
        newHoles[index] = {
          ...newHoles[index],
          par: numValue
        };
        return newHoles;
      });
    } else if (value === '') {
      // Allow empty value for easier editing
      setLocalHoles(prev => {
        const newHoles = [...prev];
        newHoles[index] = {
          ...newHoles[index],
          par: 0
        };
        return newHoles;
      });
    }
  };

  const handleHandicapChange = (index: number, value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    const numValue = value === '' ? 0 : parseInt(value, 10);
    
    // Validate range
    if (numValue >= 0) {
      setLocalHoles(prev => {
        const newHoles = [...prev];
        newHoles[index] = {
          ...newHoles[index],
          handicapIndex: numValue
        };
        return newHoles;
      });
    } else if (value === '') {
      // Allow empty value for easier editing
      setLocalHoles(prev => {
        const newHoles = [...prev];
        newHoles[index] = {
          ...newHoles[index],
          handicapIndex: 0
        };
        return newHoles;
      });
    }
  };

  const handleDistanceChange = (holeIndex: number, teeSetId: string, value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    const numValue = value === '' ? 0 : parseInt(value, 10);
    
    // Validate range
    if (numValue >= 0) {
      setLocalHoles(prev => {
        const newHoles = [...prev];
        newHoles[holeIndex] = {
          ...newHoles[holeIndex],
          distances: {
            ...newHoles[holeIndex].distances,
            [teeSetId]: numValue
          }
        };
        return newHoles;
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await onSave(localHoles);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving scorecard:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Course Scorecard</Typography>
        {!readOnly && !editMode ? (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setEditMode(true)}
          >
            Edit Scorecard
          </Button>
        ) : !readOnly && (
          <Box>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => {
                setEditMode(false);
                setLocalHoles([...holes]); // Reset to original data
              }}
              sx={{ mr: 1 }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Changes saved successfully!
        </Alert>
      )}

      <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Course Info */}
        {teeSets.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
            {teeSets.map(teeSet => (
              <Paper key={teeSet.id} sx={{ p: 2, minWidth: '200px', textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: teeSet.color || 'inherit' }}>
                  {teeSet.name} Tees
                </Typography>
                <Typography variant="body2">
                  Rating: {teeSet.rating || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Slope: {teeSet.slope || 'N/A'}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}

        {/* Scorecard - Vertical Layout with Holes in Rows */}
        <Grid container spacing={3}>
          {/* Front Nine */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>Front Nine</Typography>
            <TableContainer component={Paper}>
              <Table size="small" sx={{ 
                '& .MuiTableCell-root': { 
                  padding: '8px 12px',
                  fontSize: '0.875rem'
                }
              }}>
                <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>Hole</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>Par</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Handicap</TableCell>
                    {teeSets.map(teeSet => (
                      <TableCell 
                        key={teeSet.id} 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: teeSet.color || 'inherit',
                          width: '80px'
                        }}
                      >
                        {teeSet.name}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localHoles.slice(0, 9).map((hole, index) => (
                    <TableRow key={`hole-${hole.id || hole.number}`}>
                      <TableCell>{hole.number}</TableCell>
                      <TableCell>
                        {editMode ? (
                          <TextField
                            value={hole.par}
                            onChange={(e) => handleParChange(index, e.target.value)}
                            InputProps={{ 
                              inputProps: { min: 3, max: 5 },
                              sx: { textAlign: 'center' }
                            }}
                            size="small"
                            sx={{ width: 60 }}
                          />
                        ) : (
                          hole.par
                        )}
                      </TableCell>
                      <TableCell>
                        {editMode ? (
                          <TextField
                            value={hole.handicapIndex || ''}
                            onChange={(e) => handleHandicapChange(index, e.target.value)}
                            InputProps={{ 
                              inputProps: { min: 1, max: 18 },
                              sx: { textAlign: 'center' }
                            }}
                            size="small"
                            sx={{ width: 60 }}
                          />
                        ) : (
                          hole.handicapIndex || '-'
                        )}
                      </TableCell>
                      {teeSets.map(teeSet => (
                        <TableCell key={`dist-${teeSet.id}-${hole.id || hole.number}`} align="center">
                          {editMode ? (
                            <TextField
                              value={hole.distances[teeSet.id] || ''}
                              onChange={(e) => handleDistanceChange(index, teeSet.id, e.target.value)}
                              InputProps={{ 
                                inputProps: { min: 100, max: 999 },
                                sx: { textAlign: 'center' }
                              }}
                              size="small"
                              sx={{ width: 70 }}
                            />
                          ) : (
                            hole.distances[teeSet.id] || '-'
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Out</TableCell>
                    <TableCell>-</TableCell>
                    {teeSets.map(teeSet => (
                      <TableCell key={`total-${teeSet.id}`} align="center" sx={{ fontWeight: 'bold' }}>
                        {localHoles.slice(0, 9).reduce((sum, hole) => sum + (hole.distances[teeSet.id] || 0), 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Back Nine */}
          {localHoles.length > 9 && (
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>Back Nine</Typography>
              <TableContainer component={Paper}>
                <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { 
                    padding: '8px 12px',
                    fontSize: '0.875rem'
                  }
                }}>
                  <TableHead sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>Hole</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>Par</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', width: '100px' }}>Handicap</TableCell>
                      {teeSets.map(teeSet => (
                        <TableCell 
                          key={teeSet.id} 
                          align="center" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: teeSet.color || 'inherit',
                            width: '80px'
                          }}
                        >
                          {teeSet.name}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localHoles.slice(9, 18).map((hole, index) => (
                      <TableRow key={`hole-${hole.id || hole.number}`}>
                        <TableCell>{hole.number}</TableCell>
                        <TableCell>
                          {editMode ? (
                            <TextField
                              value={hole.par}
                              onChange={(e) => handleParChange(index + 9, e.target.value)}
                              InputProps={{ 
                                inputProps: { min: 3, max: 5 },
                                sx: { textAlign: 'center' }
                              }}
                              size="small"
                              sx={{ width: 60 }}
                            />
                          ) : (
                            hole.par
                          )}
                        </TableCell>
                        <TableCell>
                          {editMode ? (
                            <TextField
                              value={hole.handicapIndex || ''}
                              onChange={(e) => handleHandicapChange(index + 9, e.target.value)}
                              InputProps={{ 
                                inputProps: { min: 1, max: 18 },
                                sx: { textAlign: 'center' }
                              }}
                              size="small"
                              sx={{ width: 60 }}
                            />
                          ) : (
                            hole.handicapIndex || '-'
                          )}
                        </TableCell>
                        {teeSets.map(teeSet => (
                          <TableCell key={`dist-${teeSet.id}-${hole.id || hole.number}`} align="center">
                            {editMode ? (
                              <TextField
                                value={hole.distances[teeSet.id] || ''}
                                onChange={(e) => handleDistanceChange(index + 9, teeSet.id, e.target.value)}
                                InputProps={{ 
                                  inputProps: { min: 100, max: 999 },
                                  sx: { textAlign: 'center' }
                                }}
                                size="small"
                                sx={{ width: 70 }}
                              />
                            ) : (
                              hole.distances[teeSet.id] || '-'
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {/* Totals rows */}
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>In</TableCell>
                      <TableCell>-</TableCell>
                      {teeSets.map(teeSet => (
                        <TableCell key={`in-${teeSet.id}`} align="center" sx={{ fontWeight: 'bold' }}>
                          {localHoles.slice(9, 18).reduce((sum, hole) => sum + (hole.distances[teeSet.id] || 0), 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell>-</TableCell>
                      {teeSets.map(teeSet => (
                        <TableCell key={`total-${teeSet.id}`} align="center" sx={{ fontWeight: 'bold' }}>
                          {localHoles.reduce((sum, hole) => sum + (hole.distances[teeSet.id] || 0), 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
} 