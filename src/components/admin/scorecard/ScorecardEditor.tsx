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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

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
  notes?: string;
}

export interface ScorecardEditorProps {
  courseId: string;
  teeSets: TeeSet[];
  holes: HoleData[];
  onSave: (holes: HoleData[]) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  readOnly?: boolean;
  startInEditMode?: boolean;
}

export default function ScorecardEditor({
  courseId,
  teeSets,
  holes,
  onSave,
  onCancel,
  loading = false,
  readOnly = false,
  startInEditMode = false
}: ScorecardEditorProps) {
  const [localHoles, setLocalHoles] = useState<HoleData[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editMode, setEditMode] = useState(startInEditMode);
  const [editingCell, setEditingCell] = useState<{
    holeIndex: number;
    field: 'par' | 'handicapIndex' | 'notes';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // State for notes modal
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [currentHoleIndex, setCurrentHoleIndex] = useState<number | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');

  // Initialize local holes from props
  useEffect(() => {
    if (holes.length > 0) {
      setLocalHoles([...holes]);
    } else {
      // Create default 18 holes if none provided
      const defaultHoles = Array.from({ length: 18 }, (_, i) => {
        return {
          number: i + 1,
          par: 4,
          handicapIndex: i + 1,
          notes: ''
        };
      });
      
      setLocalHoles(defaultHoles);
    }
  }, [holes]);

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

  const handleNotesChange = (index: number, value: string) => {
    console.log(`Changing notes for hole index ${index} to:`, value);
    setLocalHoles(prev => {
      const newHoles = [...prev];
      newHoles[index] = {
        ...newHoles[index],
        notes: value
      };
      console.log(`Updated hole ${newHoles[index].number} with notes:`, newHoles[index].notes);
      return newHoles;
    });
  };

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      console.log('Saving holes with notes:', localHoles.map(hole => ({ number: hole.number, notes: hole.notes })));
      
      try {
        await onSave(localHoles);
        setSuccess(true);
        setEditMode(false);
      } catch (err) {
        setError('Failed to save scorecard data');
        console.error('Error saving scorecard:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  // Open notes modal for a specific hole
  const openNotesModal = (index: number) => {
    setCurrentHoleIndex(index);
    const currentNoteValue = localHoles[index]?.notes || '';
    console.log(`Opening notes modal for hole index ${index}, current notes:`, currentNoteValue);
    setCurrentNotes(currentNoteValue);
    setNotesModalOpen(true);
  };
  
  // Save notes from modal
  const saveNotes = () => {
    if (currentHoleIndex !== null) {
      console.log(`Saving notes from modal for hole index ${currentHoleIndex}:`, currentNotes);
      handleNotesChange(currentHoleIndex, currentNotes);
    }
    setNotesModalOpen(false);
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
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
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
                      <TableCell>
                        {editMode ? (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => openNotesModal(index)}
                            sx={{ minWidth: '100px' }}
                          >
                            {hole.notes ? 'Edit Notes' : 'Add Notes'}
                          </Button>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {hole.notes ? (
                              <>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 150, mr: 1 }}>
                                  {hole.notes}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => openNotesModal(index)}
                                  disabled={!editMode}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
                              '-'
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
                      <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
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
                        <TableCell>
                          {editMode ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => openNotesModal(index + 9)}
                              sx={{ minWidth: '100px' }}
                            >
                              {hole.notes ? 'Edit Notes' : 'Add Notes'}
                            </Button>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {hole.notes ? (
                                <>
                                  <Typography variant="body2" noWrap sx={{ maxWidth: 150, mr: 1 }}>
                                    {hole.notes}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => openNotesModal(index + 9)}
                                    disabled={!editMode}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </>
                              ) : (
                                '-'
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Add a centered save button at the bottom */}
      {!readOnly && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={editMode ? handleSave : () => setEditMode(true)}
            disabled={saving}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {saving ? <CircularProgress size={24} /> : editMode ? 'Save Changes' : 'Edit Scorecard'}
          </Button>
        </Box>
      )}
      
      {/* Notes Modal */}
      <Dialog 
        open={notesModalOpen} 
        onClose={() => setNotesModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {currentHoleIndex !== null && `Hole ${localHoles[currentHoleIndex]?.number} Notes`}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            placeholder="Enter notes about this hole (e.g., hazards, strategy, etc.)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesModalOpen(false)}>Cancel</Button>
          <Button onClick={saveNotes} variant="contained" color="primary">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 