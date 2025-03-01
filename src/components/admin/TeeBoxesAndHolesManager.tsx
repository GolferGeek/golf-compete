"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  Grid, 
  TextField, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabaseClient } from '@/lib/auth';

interface TeeBoxesAndHolesManagerProps {
  courseId: string;
  courseName: string;
  numberOfHoles: number;
}

interface TeeBox {
  id?: string;
  name: string;
  color: string;
  rating: number;
  slope: number;
  par: number;
  distance: number;
}

interface Hole {
  id?: string;
  holeNumber: number;
  par: number;
  handicapIndex: number;
  distances: { [teeBoxId: string]: number };
}

export default function TeeBoxesAndHolesManager({ 
  courseId, 
  courseName,
  numberOfHoles 
}: TeeBoxesAndHolesManagerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [teeBoxes, setTeeBoxes] = useState<TeeBox[]>([]);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [teeBoxDialogOpen, setTeeBoxDialogOpen] = useState(false);
  const [holeDialogOpen, setHoleDialogOpen] = useState(false);
  const [currentTeeBox, setCurrentTeeBox] = useState<TeeBox>({
    name: '',
    color: '',
    rating: 72.0,
    slope: 113,
    par: 72,
    distance: 6500
  });
  const [currentHole, setCurrentHole] = useState<Hole>({
    holeNumber: 1,
    par: 4,
    handicapIndex: 1,
    distances: {}
  });
  const [editingTeeBoxId, setEditingTeeBoxId] = useState<string | null>(null);
  const [editingHoleId, setEditingHoleId] = useState<string | null>(null);
  
  // Fetch tee boxes and holes data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch tee boxes
      const { data: teeBoxData, error: teeBoxError } = await supabaseClient
        .from('tee_sets')
        .select('*')
        .eq('course_id', courseId);
      
      if (teeBoxError) throw teeBoxError;
      
      // Fetch holes
      const { data: holeData, error: holeError } = await supabaseClient
        .from('holes')
        .select('*')
        .eq('course_id', courseId)
        .order('hole_number');
      
      if (holeError) throw holeError;
      
      // Fetch tee set distances
      const { data: distanceData, error: distanceError } = await supabaseClient
        .from('tee_set_distances')
        .select('*')
        .in('hole_id', holeData?.map(hole => hole.id) || []);
      
      if (distanceError) throw distanceError;
      
      // Process tee boxes
      const processedTeeBoxes = teeBoxData?.map(teeBox => ({
        id: teeBox.id,
        name: teeBox.name,
        color: teeBox.color,
        rating: teeBox.rating,
        slope: teeBox.slope,
        par: teeBox.par,
        distance: teeBox.distance
      })) || [];
      
      // Process holes with distances
      const processedHoles = holeData?.map(hole => {
        const holeDistances: { [teeBoxId: string]: number } = {};
        
        distanceData?.forEach(distance => {
          if (distance.hole_id === hole.id) {
            holeDistances[distance.tee_set_id] = distance.distance;
          }
        });
        
        return {
          id: hole.id,
          holeNumber: hole.hole_number,
          par: hole.par,
          handicapIndex: hole.handicap_index || 0,
          distances: holeDistances
        };
      }) || [];
      
      setTeeBoxes(processedTeeBoxes);
      setHoles(processedHoles);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tee boxes and holes data.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Tee Box Dialog Handlers
  const openTeeBoxDialog = (teeBox?: TeeBox) => {
    if (teeBox) {
      setCurrentTeeBox(teeBox);
      setEditingTeeBoxId(teeBox.id || null);
    } else {
      setCurrentTeeBox({
        name: '',
        color: '',
        rating: 72.0,
        slope: 113,
        par: 72,
        distance: 6500
      });
      setEditingTeeBoxId(null);
    }
    setTeeBoxDialogOpen(true);
  };
  
  const closeTeeBoxDialog = () => {
    setTeeBoxDialogOpen(false);
  };
  
  const handleTeeBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTeeBox(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'color' ? value : Number(value)
    }));
  };
  
  const handleTeeBoxSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!currentTeeBox.name || !currentTeeBox.color) {
        setError('Name and color are required for tee boxes.');
        return;
      }
      
      let result;
      
      if (editingTeeBoxId) {
        // Update existing tee box
        result = await supabaseClient
          .from('tee_sets')
          .update({
            name: currentTeeBox.name,
            color: currentTeeBox.color,
            rating: currentTeeBox.rating,
            slope: currentTeeBox.slope,
            par: currentTeeBox.par,
            distance: currentTeeBox.distance
          })
          .eq('id', editingTeeBoxId);
      } else {
        // Insert new tee box
        result = await supabaseClient
          .from('tee_sets')
          .insert({
            course_id: courseId,
            name: currentTeeBox.name,
            color: currentTeeBox.color,
            rating: currentTeeBox.rating,
            slope: currentTeeBox.slope,
            par: currentTeeBox.par,
            distance: currentTeeBox.distance
          });
      }
      
      if (result.error) throw result.error;
      
      setSuccess(`Tee box ${editingTeeBoxId ? 'updated' : 'created'} successfully!`);
      closeTeeBoxDialog();
      fetchData();
    } catch (err) {
      console.error('Error saving tee box:', err);
      setError('Failed to save tee box. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteTeeBox = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tee box? This will also delete all associated distances.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabaseClient
        .from('tee_sets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccess('Tee box deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting tee box:', err);
      setError('Failed to delete tee box. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Hole Dialog Handlers
  const openHoleDialog = (hole?: Hole) => {
    if (hole) {
      setCurrentHole(hole);
      setEditingHoleId(hole.id || null);
    } else {
      // Find the next hole number
      const existingHoleNumbers = holes.map(h => h.holeNumber);
      let nextHoleNumber = 1;
      while (existingHoleNumbers.includes(nextHoleNumber)) {
        nextHoleNumber++;
      }
      
      setCurrentHole({
        holeNumber: nextHoleNumber,
        par: 4,
        handicapIndex: nextHoleNumber,
        distances: {}
      });
      setEditingHoleId(null);
    }
    setHoleDialogOpen(true);
  };
  
  const closeHoleDialog = () => {
    setHoleDialogOpen(false);
  };
  
  const handleHoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentHole(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };
  
  const handleHoleDistanceChange = (teeBoxId: string, value: string) => {
    setCurrentHole(prev => ({
      ...prev,
      distances: {
        ...prev.distances,
        [teeBoxId]: Number(value)
      }
    }));
  };
  
  const handleHoleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (currentHole.holeNumber < 1 || currentHole.holeNumber > numberOfHoles) {
        setError(`Hole number must be between 1 and ${numberOfHoles}.`);
        return;
      }
      
      // Check if hole number already exists (for new holes)
      if (!editingHoleId) {
        const existingHole = holes.find(h => h.holeNumber === currentHole.holeNumber);
        if (existingHole) {
          setError(`Hole ${currentHole.holeNumber} already exists.`);
          return;
        }
      }
      
      let holeId = editingHoleId;
      
      if (editingHoleId) {
        // Update existing hole
        const { error } = await supabaseClient
          .from('holes')
          .update({
            hole_number: currentHole.holeNumber,
            par: currentHole.par,
            handicap_index: currentHole.handicapIndex
          })
          .eq('id', editingHoleId);
        
        if (error) throw error;
      } else {
        // Insert new hole
        const { data, error } = await supabaseClient
          .from('holes')
          .insert({
            course_id: courseId,
            hole_number: currentHole.holeNumber,
            par: currentHole.par,
            handicap_index: currentHole.handicapIndex
          })
          .select();
        
        if (error) throw error;
        holeId = data[0].id;
      }
      
      // Update distances for each tee box
      if (holeId) {
        for (const teeBoxId in currentHole.distances) {
          const distance = currentHole.distances[teeBoxId];
          
          // Check if distance record exists
          const { data: existingData, error: checkError } = await supabaseClient
            .from('tee_set_distances')
            .select('id')
            .eq('hole_id', holeId)
            .eq('tee_set_id', teeBoxId);
          
          if (checkError) throw checkError;
          
          if (existingData && existingData.length > 0) {
            // Update existing distance
            const { error } = await supabaseClient
              .from('tee_set_distances')
              .update({ distance })
              .eq('id', existingData[0].id);
            
            if (error) throw error;
          } else {
            // Insert new distance
            const { error } = await supabaseClient
              .from('tee_set_distances')
              .insert({
                hole_id: holeId,
                tee_set_id: teeBoxId,
                distance
              });
            
            if (error) throw error;
          }
        }
      }
      
      setSuccess(`Hole ${editingHoleId ? 'updated' : 'created'} successfully!`);
      closeHoleDialog();
      fetchData();
    } catch (err) {
      console.error('Error saving hole:', err);
      setError('Failed to save hole. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteHole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hole? This will also delete all associated distances.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabaseClient
        .from('holes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuccess('Hole deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting hole:', err);
      setError('Failed to delete hole. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate empty holes for a course
  const generateEmptyHoles = async () => {
    if (!confirm(`This will generate ${numberOfHoles} holes with default values. Continue?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if holes already exist
      if (holes.length > 0) {
        setError('Holes already exist for this course. Please delete them first or edit the existing holes.');
        return;
      }
      
      const newHoles: {
        course_id: string;
        hole_number: number;
        par: number;
        handicap_index: number;
      }[] = [];
      
      for (let i = 1; i <= numberOfHoles; i++) {
        newHoles.push({
          course_id: courseId,
          hole_number: i,
          par: i % 5 === 0 ? 5 : i % 4 === 0 ? 3 : 4, // Alternate par values
          handicap_index: i
        });
      }
      
      const { error } = await supabaseClient
        .from('holes')
        .insert(newHoles);
      
      if (error) throw error;
      
      setSuccess(`${numberOfHoles} holes generated successfully!`);
      fetchData();
    } catch (err) {
      console.error('Error generating holes:', err);
      setError('Failed to generate holes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h5" gutterBottom>
        {courseName} - Tee Boxes & Holes
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Tee Boxes" />
          <Tab label="Holes" />
        </Tabs>
      </Box>
      
      {/* Tee Boxes Tab */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Tee Boxes</Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => openTeeBoxDialog()}
            >
              Add Tee Box
            </Button>
          </Box>
          
          {teeBoxes.length === 0 ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1" align="center">
                No tee boxes defined yet. Add your first tee box to get started.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Slope</TableCell>
                    <TableCell>Par</TableCell>
                    <TableCell>Total Distance</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teeBoxes.map((teeBox) => (
                    <TableRow key={teeBox.id}>
                      <TableCell>{teeBox.name}</TableCell>
                      <TableCell>{teeBox.color}</TableCell>
                      <TableCell>{teeBox.rating}</TableCell>
                      <TableCell>{teeBox.slope}</TableCell>
                      <TableCell>{teeBox.par}</TableCell>
                      <TableCell>{teeBox.distance} yards</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => openTeeBoxDialog(teeBox)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => teeBox.id && handleDeleteTeeBox(teeBox.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
      
      {/* Holes Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Holes</Typography>
            <Box>
              <Button 
                variant="outlined" 
                sx={{ mr: 1 }}
                onClick={generateEmptyHoles}
                disabled={holes.length > 0}
              >
                Generate {numberOfHoles} Holes
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => openHoleDialog()}
              >
                Add Hole
              </Button>
            </Box>
          </Box>
          
          {holes.length === 0 ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1" align="center">
                No holes defined yet. Add holes individually or use the "Generate Holes" button.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hole</TableCell>
                    <TableCell>Par</TableCell>
                    <TableCell>Handicap</TableCell>
                    {teeBoxes.map((teeBox) => (
                      <TableCell key={teeBox.id}>{teeBox.name} Distance</TableCell>
                    ))}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holes.sort((a, b) => a.holeNumber - b.holeNumber).map((hole) => (
                    <TableRow key={hole.id}>
                      <TableCell>{hole.holeNumber}</TableCell>
                      <TableCell>{hole.par}</TableCell>
                      <TableCell>{hole.handicapIndex}</TableCell>
                      {teeBoxes.map((teeBox) => (
                        <TableCell key={teeBox.id}>
                          {hole.distances[teeBox.id as string] || '-'} 
                          {hole.distances[teeBox.id as string] ? ' yards' : ''}
                        </TableCell>
                      ))}
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => openHoleDialog(hole)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => hole.id && handleDeleteHole(hole.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
      
      {/* Tee Box Dialog */}
      <Dialog open={teeBoxDialogOpen} onClose={closeTeeBoxDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeeBoxId ? 'Edit Tee Box' : 'Add Tee Box'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={currentTeeBox.name}
                onChange={handleTeeBoxChange}
                required
                helperText="e.g., Championship, Men's, Women's, Senior"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Color"
                name="color"
                value={currentTeeBox.color}
                onChange={handleTeeBoxChange}
                required
                helperText="e.g., Blue, White, Red, Gold"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Course Rating"
                name="rating"
                type="number"
                value={currentTeeBox.rating}
                onChange={handleTeeBoxChange}
                InputProps={{ inputProps: { min: 55, max: 90, step: 0.1 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Slope Rating"
                name="slope"
                type="number"
                value={currentTeeBox.slope}
                onChange={handleTeeBoxChange}
                InputProps={{ inputProps: { min: 55, max: 155 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Par"
                name="par"
                type="number"
                value={currentTeeBox.par}
                onChange={handleTeeBoxChange}
                InputProps={{ inputProps: { min: 68, max: 74 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Distance (yards)"
                name="distance"
                type="number"
                value={currentTeeBox.distance}
                onChange={handleTeeBoxChange}
                InputProps={{ inputProps: { min: 4000, max: 8000 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTeeBoxDialog}>Cancel</Button>
          <Button 
            onClick={handleTeeBoxSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Hole Dialog */}
      <Dialog open={holeDialogOpen} onClose={closeHoleDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingHoleId ? 'Edit Hole' : 'Add Hole'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Hole Number"
                name="holeNumber"
                type="number"
                value={currentHole.holeNumber}
                onChange={handleHoleChange}
                required
                InputProps={{ inputProps: { min: 1, max: numberOfHoles } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Par"
                name="par"
                type="number"
                value={currentHole.par}
                onChange={handleHoleChange}
                required
                InputProps={{ inputProps: { min: 3, max: 5 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Handicap Index"
                name="handicapIndex"
                type="number"
                value={currentHole.handicapIndex}
                onChange={handleHoleChange}
                required
                InputProps={{ inputProps: { min: 1, max: numberOfHoles } }}
                helperText="1 = hardest hole, 18 = easiest"
              />
            </Grid>
            
            {teeBoxes.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Distances from Tee Boxes (yards)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                {teeBoxes.map((teeBox) => (
                  <Grid item xs={12} md={4} key={teeBox.id}>
                    <TextField
                      fullWidth
                      label={`${teeBox.name} (${teeBox.color})`}
                      type="number"
                      value={currentHole.distances[teeBox.id as string] || ''}
                      onChange={(e) => teeBox.id && handleHoleDistanceChange(teeBox.id, e.target.value)}
                      InputProps={{ inputProps: { min: 100, max: 700 } }}
                    />
                  </Grid>
                ))}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHoleDialog}>Cancel</Button>
          <Button 
            onClick={handleHoleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 