import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { v4 as uuidv4 } from 'uuid';
import { TeeBoxesStepProps, TeeSet } from '../types';
import ImageUploader from '../components/ImageUploader';

const TeeBoxesStep: React.FC<TeeBoxesStepProps> = ({
  courseId,
  teeBoxes,
  setTeeBoxes,
  holes,
  setHoles,
  handleNext,
  handleBack,
  loading,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTeeBox, setCurrentTeeBox] = useState<TeeSet | null>(null);
  const [teeBoxForm, setTeeBoxForm] = useState({
    name: '',
    color: '',
    rating: 0,
    slope: 0
  });
  
  // Open dialog to add a new tee box
  const openTeeBoxDialog = () => {
    setCurrentTeeBox(null);
    setTeeBoxForm({
      name: '',
      color: '',
      rating: 0,
      slope: 0
    });
    setDialogOpen(true);
  };
  
  // Open dialog to edit an existing tee box
  const editTeeBox = (teeBox: TeeSet) => {
    setCurrentTeeBox(teeBox);
    setTeeBoxForm({
      name: teeBox.name,
      color: teeBox.color,
      rating: teeBox.rating,
      slope: teeBox.slope
    });
    setDialogOpen(true);
  };
  
  // Handle form changes in the dialog
  const handleTeeBoxFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeeBoxForm({
      ...teeBoxForm,
      [name]: name === 'rating' || name === 'slope' ? Number(value) : value
    });
  };
  
  // Save tee box from dialog
  const saveTeeBox = async () => {
    if (currentTeeBox) {
      // Update existing tee box
      const updatedTeeBoxes = teeBoxes.map(tb => 
        tb.id === currentTeeBox.id ? { ...tb, ...teeBoxForm } : tb
      );
      setTeeBoxes(updatedTeeBoxes);
    } else {
      // Add new tee box
      const newTeeBox: TeeSet = {
        id: uuidv4(),
        ...teeBoxForm
      };
      setTeeBoxes([...teeBoxes, newTeeBox]);
    }
    
    setDialogOpen(false);
  };
  
  // Delete a tee box
  const deleteTeeBox = (id: string) => {
    if (confirm('Are you sure you want to delete this tee box?')) {
      setTeeBoxes(teeBoxes.filter(tb => tb.id !== id));
    }
  };
  
  // Handle image extraction data
  const handleTeeBoxDataExtracted = (extractedData: any) => {
    if (Array.isArray(extractedData)) {
      // Process extracted tee boxes
      const extractedTeeBoxes: TeeSet[] = extractedData.map((teeSet: any) => ({
        id: uuidv4(),
        name: teeSet.name || teeSet.color,
        color: teeSet.color,
        rating: parseFloat(teeSet.rating) || 0,
        slope: parseInt(teeSet.slope) || 0
      }));
      
      setTeeBoxes(extractedTeeBoxes);
      console.log('Current courseId for tee boxes:', courseId);
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      {courseId ? (
        <Box>
          {/* AI-Assisted Data Extraction Card */}
          <ImageUploader
            step="teeBoxes"
            processingImage={processingImage}
            setProcessingImage={setProcessingImage}
            extractionStep={extractionStep}
            setExtractionStep={setExtractionStep}
            onDataExtracted={handleTeeBoxDataExtracted}
          />

          <Typography variant="h6" gutterBottom>
            Tee Boxes
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={openTeeBoxDialog}
            >
              Add Tee Box
            </Button>
          </Box>
          
          {teeBoxes.length > 0 ? (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
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
                  {teeBoxes.map((teeBox) => (
                    <TableRow key={teeBox.id}>
                      <TableCell>{teeBox.name}</TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: '50%', 
                            backgroundColor: teeBox.color,
                            border: '1px solid #ccc'
                          }} 
                        />
                      </TableCell>
                      <TableCell>{teeBox.rating}</TableCell>
                      <TableCell>{teeBox.slope}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => editTeeBox(teeBox)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => deleteTeeBox(teeBox.id)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No tee boxes added yet. Add tee boxes manually or use the AI extraction tool above.
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
                onClick={handleNext}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Skip to Scorecard
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  // Save tee boxes first, then navigate to next step
                  const saveTeeBoxesEvent = new CustomEvent('save-tee-boxes');
                  window.dispatchEvent(saveTeeBoxesEvent);
                  handleNext();
                }}
                disabled={loading || teeBoxes.length === 0}
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            </Box>
          </Box>
          
          {/* Tee Box Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
            <DialogTitle>{currentTeeBox ? 'Edit Tee Box' : 'Add Tee Box'}</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1, width: '400px' }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Name"
                  name="name"
                  value={teeBoxForm.name}
                  onChange={handleTeeBoxFormChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Color"
                  name="color"
                  value={teeBoxForm.color}
                  onChange={handleTeeBoxFormChange}
                  helperText="Enter a color name (e.g. blue, red) or hex code (#0000FF)"
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Rating"
                  name="rating"
                  type="number"
                  value={teeBoxForm.rating}
                  onChange={handleTeeBoxFormChange}
                  inputProps={{ step: 0.1 }}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Slope"
                  name="slope"
                  type="number"
                  value={teeBoxForm.slope}
                  onChange={handleTeeBoxFormChange}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveTeeBox} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            No Course ID Found
          </Typography>
          <Typography variant="body1" paragraph>
            Please save the course information first before adding tee boxes.
          </Typography>
          <Button variant="contained" onClick={handleBack}>
            Go Back to Course Information
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default TeeBoxesStep; 