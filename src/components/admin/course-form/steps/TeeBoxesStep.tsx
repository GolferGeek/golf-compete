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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { TeeBoxesStepProps, TeeSet, Hole, ExtractionStep } from '../types';
import ImageUploader from '../components/ImageUploader';

const TeeBoxesStep: React.FC<TeeBoxesStepProps> = ({
  courseId,
  teeBoxes,
  setTeeBoxes,
  holes,
  setHoles,
  handleNext,
  handleBack,
  saveTeeBoxes,
  loading,
  processingImage,
  setProcessingImage,
  extractionStep,
  setExtractionStep,
  isMobile
}) => {
  const theme = useTheme();
  const isSmallScreen = isMobile || useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTeeBox, setCurrentTeeBox] = useState<TeeSet | null>(null);
  const [teeBoxForm, setTeeBoxForm] = useState({
    name: '',
    color: '',
    rating: 0,
    slope: 0,
    length: 0
  });
  
  // Open dialog to add a new tee box
  const openTeeBoxDialog = () => {
    setTeeBoxForm({
      name: '',
      color: '',
      rating: 0,
      slope: 0,
      length: 0
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
      slope: teeBox.slope,
      length: teeBox.length || 0
    });
    setDialogOpen(true);
  };
  
  // Handle form changes in the dialog
  const handleTeeBoxFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeeBoxForm({
      ...teeBoxForm,
      [name]: name === 'rating' || name === 'slope' || name === 'length' 
        ? Number(value) 
        : value
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
    if (Array.isArray(extractedData) && extractedData.length > 0) {
      const newTeeBoxes = extractedData.map((teeSet: any) => ({
        id: uuidv4(),
        name: teeSet.name || '',
        color: teeSet.color || '',
        rating: parseFloat(teeSet.rating) || 0,
        slope: parseInt(teeSet.slope) || 0,
        length: teeSet.length || 0
      }));
      
      setTeeBoxes(newTeeBoxes);
      if (setExtractionStep) {
        setExtractionStep('holes' as ExtractionStep);
      }
    }
  };
  
  // Render tee boxes as cards for mobile view
  const renderTeeBoxCards = () => {
    return (
      <Grid container spacing={2}>
        {teeBoxes.map((teeBox) => (
          <Grid item xs={12} sm={6} md={4} key={teeBox.id}>
            <Card sx={{ 
              bgcolor: teeBox.color.toLowerCase(), 
              color: ['white', 'black', 'navy', 'darkgreen', 'purple'].includes(teeBox.color.toLowerCase()) ? 'white' : 'black',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6">{teeBox.name}</Typography>
                <Typography variant="body2">Rating: {teeBox.rating}</Typography>
                <Typography variant="body2">Slope: {teeBox.slope}</Typography>
                <Typography variant="body2">Length: {teeBox.length || 0} yards</Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => editTeeBox(teeBox)}
                  sx={{ color: 'inherit' }}
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button 
                  size="small" 
                  onClick={() => deleteTeeBox(teeBox.id)}
                  sx={{ color: 'inherit' }}
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render tee boxes as table for desktop view
  const renderTeeBoxTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Slope</TableCell>
              <TableCell>Length</TableCell>
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
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: teeBox.color.toLowerCase(),
                      display: 'inline-block',
                      mr: 1,
                    }}
                  />
                  {teeBox.color}
                </TableCell>
                <TableCell>{teeBox.rating}</TableCell>
                <TableCell>{teeBox.slope}</TableCell>
                <TableCell>{teeBox.length || 0} yards</TableCell>
                <TableCell>
                  <IconButton onClick={() => editTeeBox(teeBox)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => deleteTeeBox(teeBox.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  return (
    <Paper sx={{ p: isSmallScreen ? 2 : 3 }}>
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
            isMobile={isSmallScreen}
          />

          <Typography variant="h6" gutterBottom>
            Tee Boxes
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={openTeeBoxDialog}
              fullWidth={isSmallScreen}
              size={isSmallScreen ? "small" : "medium"}
            >
              Add Tee Box
            </Button>
          </Box>
          
          {teeBoxes.length > 0 ? (
            isSmallScreen ? renderTeeBoxCards() : renderTeeBoxTable()
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No tee boxes added yet. Add tee boxes manually or use the AI extraction tool above.
            </Typography>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isSmallScreen ? 'column' : 'row',
            justifyContent: isSmallScreen ? 'center' : 'space-between', 
            mt: 4,
            gap: isSmallScreen ? 2 : 0
          }}>
            <Button 
              onClick={handleBack} 
              disabled={loading}
              fullWidth={isSmallScreen}
              sx={{ mb: isSmallScreen ? 1 : 0 }}
            >
              Previous
            </Button>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isSmallScreen ? 'column' : 'row',
              gap: isSmallScreen ? 1 : 0
            }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleNext ? handleNext : undefined}
                sx={{ mr: isSmallScreen ? 0 : 1 }}
                disabled={loading || !handleNext}
                fullWidth={isSmallScreen}
              >
                Skip to Scorecard
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  // Save tee boxes first, then navigate to next step
                  if (saveTeeBoxes) {
                    const saved = await saveTeeBoxes();
                    if (saved && handleNext) {
                      handleNext();
                    }
                  }
                }}
                disabled={loading || teeBoxes.length === 0}
                fullWidth={isSmallScreen}
              >
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            </Box>
          </Box>
          
          {/* Tee Box Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            fullScreen={isSmallScreen}
          >
            <DialogTitle>{currentTeeBox ? 'Edit Tee Box' : 'Add Tee Box'}</DialogTitle>
            <DialogContent>
              <Box sx={{ minWidth: isSmallScreen ? '100%' : '400px' }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Name"
                  name="name"
                  value={teeBoxForm.name}
                  onChange={handleTeeBoxFormChange}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Color"
                  name="color"
                  value={teeBoxForm.color}
                  onChange={handleTeeBoxFormChange}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Rating"
                  name="rating"
                  type="number"
                  value={teeBoxForm.rating}
                  onChange={handleTeeBoxFormChange}
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  margin="dense"
                  label="Slope"
                  type="number"
                  fullWidth
                  name="slope"
                  value={teeBoxForm.slope || ''}
                  onChange={handleTeeBoxFormChange}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  label="Length (yards)"
                  type="number"
                  fullWidth
                  name="length"
                  value={teeBoxForm.length || 0}
                  onChange={handleTeeBoxFormChange}
                  sx={{ mb: 2 }}
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