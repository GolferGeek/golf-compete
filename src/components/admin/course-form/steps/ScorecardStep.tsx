import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { ScorecardStepProps, Hole, TeeSet } from '../types';
import ImageUploader from '../components/ImageUploader';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, NoteAdd as NoteAddIcon, Edit as EditIcon } from '@mui/icons-material';

const ScorecardStep: React.FC<ScorecardStepProps> = ({
  courseId,
  teeBoxes,
  holes,
  setHoles,
  handleSubmit,
  handleBack,
  saveScorecard,
  loading,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep,
  isMobile
}) => {
  const theme = useTheme();
  const isSmallScreen = isMobile || useMediaQuery(theme.breakpoints.down('md'));
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  
  // Notes modal state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [currentHoleIndex, setCurrentHoleIndex] = useState<number | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  
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
        handicap_index: i, // Default handicap index
        notes: ''
      });
    }
    
    setHoles(newHoles);
    setUnsavedChanges(true);
  };

  // Handle direct input change
  const handleInputChange = (holeIndex: number, field: keyof Hole, value: any) => {
    const updatedHoles = [...holes];
    
    // For numeric fields, ensure valid values
    if (field === 'par' || field === 'handicap_index') {
      const numValue = parseInt(value) || 0;
      if (field === 'par') {
        // Par should be between 1 and 10
        updatedHoles[holeIndex][field] = Math.min(Math.max(numValue, 1), 10);
      } else if (field === 'handicap_index') {
        // Handicap index should be between 1 and 18
        updatedHoles[holeIndex][field] = Math.min(Math.max(numValue, 1), 18);
      }
    } else if (field === 'notes') {
      // For notes field
      updatedHoles[holeIndex].notes = value as string;
    }
    
    setHoles(updatedHoles);
    setUnsavedChanges(true);
  };
  
  // Save the scorecard data
  const handleSave = async () => {
    if (saveScorecard) {
      const success = await saveScorecard();
      if (success) {
        setUnsavedChanges(false);
      }
    }
  };

  // Handle extracted data from image processing
  const handleScorecardDataExtracted = (extractedData: any) => {
    if (!extractedData || !Array.isArray(extractedData) || extractedData.length === 0) {
      console.error('Invalid scorecard data format:', extractedData);
      return;
    }
    
    try {
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
      });
      
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    } catch (error) {
      console.error('Error processing extracted scorecard data:', error);
    }
  };
  
  // Open notes modal for a specific hole
  const openNotesModal = (index: number) => {
    setCurrentHoleIndex(index);
    const currentNoteValue = holes[index]?.notes || '';
    setCurrentNotes(currentNoteValue);
    setNotesModalOpen(true);
  };
  
  // Save notes from modal
  const saveNotes = () => {
    if (currentHoleIndex !== null) {
      const updatedHoles = [...holes];
      updatedHoles[currentHoleIndex] = {
        ...updatedHoles[currentHoleIndex],
        notes: currentNotes
      };
      setHoles(updatedHoles);
      setUnsavedChanges(true);
    }
    setNotesModalOpen(false);
  };

  // Render a group of holes (front 9 or back 9)
  const renderHoleGroup = (start: number, end: number, title: string) => {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <TableContainer component={Paper}>
          <Table size={isSmallScreen ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell align="center">Hole</TableCell>
                <TableCell align="center">Par</TableCell>
                <TableCell align="center">Handicap</TableCell>
                <TableCell align="center">Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holes.slice(start, end).map((hole, index) => {
                const actualIndex = start + index;
                return (
                  <TableRow key={hole.number}>
                    <TableCell align="center">{hole.number}</TableCell>
                    <TableCell align="center">
                      <TextField
                        value={hole.par}
                        onChange={(e) => handleInputChange(actualIndex, 'par', e.target.value)}
                        inputProps={{ min: 1, max: 10, style: { textAlign: 'center' } }}
                        size="small"
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        value={hole.handicap_index}
                        onChange={(e) => handleInputChange(actualIndex, 'handicap_index', e.target.value)}
                        inputProps={{ min: 1, max: 18, style: { textAlign: 'center' } }}
                        size="small"
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="primary" 
                        onClick={() => openNotesModal(actualIndex)}
                        size="small"
                      >
                        {hole.notes ? <EditIcon /> : <NoteAddIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Scorecard Data
      </Typography>
      
      {teeBoxes.length === 0 ? (
        <Typography color="error">
          Please add at least one tee box before entering scorecard data.
        </Typography>
      ) : (
        <>
          {/* Responsive Grid for Front 9 and Back 9 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {renderHoleGroup(0, 9, "Front Nine")}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderHoleGroup(9, 18, "Back Nine")}
            </Grid>
          </Grid>
          
          <Grid container spacing={2} sx={{ mb: 3, mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Scorecard Image
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Alternatively, you can upload a scorecard image to automatically extract data.
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
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              disabled={loading}
            >
              Previous
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading || !unsavedChanges}
            >
              Save Scorecard
            </Button>
            
            {handleSubmit && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading || unsavedChanges}
              >
                Complete Course Setup
              </Button>
            )}
          </Box>
          
          {/* Notes Modal */}
          <Dialog 
            open={notesModalOpen} 
            onClose={() => setNotesModalOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              {currentHoleIndex !== null && `Hole ${holes[currentHoleIndex]?.number} Notes`}
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
        </>
      )}
    </Box>
  );
};

export default ScorecardStep; 