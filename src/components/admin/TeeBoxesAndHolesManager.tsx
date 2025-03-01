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
import { supabase } from '@/lib/supabase';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
  par: number | null;
  handicapIndex: number | null;
  distances: { [teeBoxId: string]: number | null };
}

export default function TeeBoxesAndHolesManager({ 
  courseId, 
  courseName,
  numberOfHoles 
}: TeeBoxesAndHolesManagerProps) {
  const { session } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [teeBoxes, setTeeBoxes] = useState<TeeBox[]>([]);
  const [holes, setHoles] = useState<Hole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add back the isSaving state
  const [isSaving, setIsSaving] = useState(false);
  
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
  
  // Replace the complex state management with a simpler approach
  const [editableHoles, setEditableHoles] = useState<Hole[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Fetch tee boxes and holes data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to fetch tee boxes and holes');
        setError('You must be logged in to view tee boxes and holes. Please log in and try again.');
        setLoading(false);
        return;
      }
      
      // Fetch tee boxes
      const { data: teeBoxData, error: teeBoxError } = await supabase
        .from('tee_sets')
        .select('*')
        .eq('course_id', courseId);
      
      if (teeBoxError) throw teeBoxError;
      
      // Fetch holes
      const { data: holeData, error: holeError } = await supabase
        .from('holes')
        .select('*')
        .eq('course_id', courseId)
        .order('hole_number');
      
      if (holeError) throw holeError;
      
      // Fetch tee set distances
      const { data: distanceData, error: distanceError } = await supabase
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
        const holeDistances: { [teeBoxId: string]: number | null } = {};
        
        distanceData?.forEach(distance => {
          if (distance.hole_id === hole.id) {
            holeDistances[distance.tee_set_id] = distance.distance;
          }
        });
        
        return {
          id: hole.id,
          holeNumber: hole.hole_number,
          par: hole.par,
          handicapIndex: hole.handicap_index,
          distances: holeDistances
        };
      }) || [];
      
      setTeeBoxes(processedTeeBoxes);
      setHoles(processedHoles);
      setEditableHoles(JSON.parse(JSON.stringify(processedHoles))); // Deep copy
      setHasChanges(false); // Reset changes flag when data is refreshed
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tee boxes and holes data.');
    } finally {
      setLoading(false);
    }
  }, [courseId, session]);
  
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
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to save tee box');
        setError('You must be logged in to save tee boxes. Please log in and try again.');
        return;
      }
      
      setLoading(true);
      
      // Validate form
      if (!currentTeeBox.name || !currentTeeBox.color) {
        setError('Name and color are required for tee boxes.');
        return;
      }
      
      let result;
      
      if (editingTeeBoxId) {
        // Update existing tee box
        result = await supabase
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
        result = await supabase
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
    try {
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to delete tee box');
        setError('You must be logged in to delete tee boxes. Please log in and try again.');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this tee box? This will also delete all associated distances.')) {
        return;
      }
      
      setLoading(true);
      
      const { error } = await supabase
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
  
  // Fix the handleHoleDialogDistanceChange function to handle undefined teeBoxId
  const handleHoleDialogDistanceChange = (teeBoxId: string | undefined, value: string) => {
    if (!teeBoxId) return;
    
    setCurrentHole(prev => ({
      ...prev,
      distances: {
        ...prev.distances,
        [teeBoxId]: value === '' ? null : Number(value)
      }
    }));
  };
  
  const handleHoleSubmit = async () => {
    try {
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to save hole');
        setError('You must be logged in to save holes. Please log in and try again.');
        return;
      }
      
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
        const { error } = await supabase
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
        const { data, error } = await supabase
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
          const { data: existingData, error: checkError } = await supabase
            .from('tee_set_distances')
            .select('id')
            .eq('hole_id', holeId)
            .eq('tee_set_id', teeBoxId);
          
          if (checkError) throw checkError;
          
          if (existingData && existingData.length > 0) {
            // Update existing distance
            const { error } = await supabase
              .from('tee_set_distances')
              .update({ distance })
              .eq('id', existingData[0].id);
            
            if (error) throw error;
          } else {
            // Insert new distance
            const { error } = await supabase
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
    try {
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to delete hole');
        setError('You must be logged in to delete holes. Please log in and try again.');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this hole? This will also delete all associated distances.')) {
        return;
      }
      
      setLoading(true);
      
      const { error } = await supabase
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
  
  // Update the generateEmptyHoles function to create holes without pre-filled values
  const generateEmptyHoles = async () => {
    try {
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to generate holes');
        setError('You must be logged in to generate holes. Please log in and try again.');
        return;
      }
      
      if (!confirm(`This will generate ${numberOfHoles} empty holes. Continue?`)) {
        return;
      }
      
      // Check if holes already exist
      if (holes.length > 0) {
        setError('Holes already exist for this course. Please delete them first or edit the existing holes.');
        return;
      }
      
      const newHoles: {
        course_id: string;
        hole_number: number;
        par: number | null;
        handicap_index: number | null;
      }[] = [];
      
      for (let i = 1; i <= numberOfHoles; i++) {
        newHoles.push({
          course_id: courseId,
          hole_number: i,
          par: null,  // Set to null instead of a default value
          handicap_index: null  // Set to null instead of a default value
        });
      }
      
      const { error } = await supabase
        .from('holes')
        .insert(newHoles);
      
      if (error) throw error;
      
      setSuccess(`${numberOfHoles} empty holes generated successfully!`);
      fetchData();
    } catch (err) {
      console.error('Error generating holes:', err);
      setError('Failed to generate holes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Replace the complex handleHoleFieldChange with a simpler direct update function
  const updateHoleField = (holeIndex: number, field: string, value: string) => {
    const newHoles = [...editableHoles];
    
    // Convert to number if the value is a valid number, otherwise keep as is
    const numValue = value === '' ? null : isNaN(Number(value)) ? newHoles[holeIndex][field as keyof Hole] : Number(value);
    
    // Update the field
    newHoles[holeIndex] = {
      ...newHoles[holeIndex],
      [field]: numValue
    };
    
    setEditableHoles(newHoles);
    setHasChanges(true);
  };
  
  // Replace the complex handleHoleDistanceChange with a simpler direct update function
  const updateHoleDistance = (holeIndex: number, teeBoxId: string, value: string) => {
    const newHoles = [...editableHoles];
    const numValue = value === '' ? null : Number(value);
    
    // Update the distance
    newHoles[holeIndex] = {
      ...newHoles[holeIndex],
      distances: {
        ...newHoles[holeIndex].distances,
        [teeBoxId]: numValue
      }
    };
    
    setEditableHoles(newHoles);
    setHasChanges(true);
  };
  
  // Simplify the saveAllHoleChanges function to use the editableHoles state
  const saveAllHoleChanges = async () => {
    try {
      // Check if we have a session
      if (!session) {
        console.error('No session found when trying to save all hole changes');
        setError('You must be logged in to save hole changes. Please log in and try again.');
        return;
      }
      
      if (!hasChanges) return;
      
      setIsSaving(true);
      setError(null);
      
      // Save each hole
      for (const hole of editableHoles) {
        if (!hole.id) continue;
        
        // Update hole data
        const { error: holeError } = await supabase
          .from('holes')
          .update({
            hole_number: hole.holeNumber,
            par: hole.par,
            handicap_index: hole.handicapIndex
          })
          .eq('id', hole.id);
        
        if (holeError) throw holeError;
        
        // Update distances for each tee box
        for (const teeBoxId in hole.distances) {
          const distance = hole.distances[teeBoxId];
          
          // Skip null distances (empty fields)
          if (distance === null) continue;
          
          // Check if distance record exists
          const { data: existingData, error: checkError } = await supabase
            .from('tee_set_distances')
            .select('id')
            .eq('hole_id', hole.id)
            .eq('tee_set_id', teeBoxId);
          
          if (checkError) throw checkError;
          
          if (existingData && existingData.length > 0) {
            // Update existing distance
            const { error } = await supabase
              .from('tee_set_distances')
              .update({ distance })
              .eq('id', existingData[0].id);
            
            if (error) throw error;
          } else if (distance) { // Only insert if distance is not null and not 0
            // Insert new distance
            const { error } = await supabase
              .from('tee_set_distances')
              .insert({
                hole_id: hole.id,
                tee_set_id: teeBoxId,
                distance
              });
            
            if (error) throw error;
          }
        }
      }
      
      setSuccess('All hole changes saved successfully!');
      setHasChanges(false);
      
      // Refresh data to ensure UI is updated correctly
      await fetchData();
      
    } catch (err) {
      console.error('Error saving hole changes:', err);
      setError('Failed to save hole changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Add a function to handle key press events for better keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, holeId: string, teeBoxId: string | null, fieldType: string, currentIndex: number) => {
    // If Enter is pressed, move to the next field
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find the next input field and focus it
      const inputs = document.querySelectorAll('input[type="number"]');
      const currentInputIndex = Array.from(inputs).findIndex(input => input === e.target);
      
      if (currentInputIndex !== -1 && currentInputIndex < inputs.length - 1) {
        (inputs[currentInputIndex + 1] as HTMLElement).focus();
      }
    }
  };
  
  // Add a function to check if a field has been modified
  const isFieldModified = (holeId: string, field: string): boolean => {
    if (!editableHoles.find(h => h.id === holeId)) return false;
    
    const hole = holes.find(h => h.id === holeId);
    if (!hole) return false;
    
    return editableHoles.find(h => h.id === holeId)?.[field as keyof Hole] !== hole[field as keyof Hole];
  };

  // Update the isDistanceModified function to handle null values
  const isDistanceModified = (holeId: string, teeBoxId: string): boolean => {
    if (!editableHoles.find(h => h.id === holeId)) return false;
    
    const hole = holes.find(h => h.id === holeId);
    if (!hole) return false;
    
    const originalDistance = hole.distances[teeBoxId] || null;
    const editedDistance = editableHoles.find(h => h.id === holeId)?.distances[teeBoxId];
    
    return originalDistance !== editedDistance;
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
                disabled={holes.length > 0 || loading}
              >
                Generate {numberOfHoles} Holes
              </Button>
              <Button 
                variant="contained" 
                onClick={saveAllHoleChanges}
                disabled={!hasChanges || isSaving}
                color="primary"
                sx={{ mr: 1, fontWeight: 'bold', fontSize: '1.1rem', py: 1 }}
                startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSaving ? 'Saving...' : 'SAVE ALL CHANGES'}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => openHoleDialog()}
              >
                Add Hole
              </Button>
            </Box>
          </Box>
          
          {/* Add a message about manual saving */}
          {hasChanges && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You have unsaved changes. Click the "SAVE ALL CHANGES" button when you're ready to save.
            </Alert>
          )}
          
          {editableHoles.length === 0 ? (
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
                  {editableHoles.sort((a, b) => a.holeNumber - b.holeNumber).map((hole, index) => (
                    <TableRow key={hole.id}>
                      <TableCell>{hole.holeNumber}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="text"
                          value={hole.par === null ? '' : hole.par}
                          onChange={(e) => updateHoleField(index, 'par', e.target.value)}
                          InputProps={{ 
                            inputProps: { 
                              pattern: '[0-9]*',
                              style: { textAlign: 'center' } 
                            }
                          }}
                          sx={{ 
                            width: '60px',
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: hole.par !== holes.find(h => h.id === hole.id)?.par ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="text"
                          value={hole.handicapIndex === null ? '' : hole.handicapIndex}
                          onChange={(e) => updateHoleField(index, 'handicapIndex', e.target.value)}
                          InputProps={{ 
                            inputProps: { 
                              pattern: '[0-9]*',
                              style: { textAlign: 'center' } 
                            }
                          }}
                          sx={{ 
                            width: '60px',
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: hole.handicapIndex !== holes.find(h => h.id === hole.id)?.handicapIndex ? 'rgba(255, 152, 0, 0.1)' : 'transparent'
                            }
                          }}
                        />
                      </TableCell>
                      {teeBoxes.map((teeBox) => (
                        <TableCell key={teeBox.id}>
                          <TextField
                            size="small"
                            type="text"
                            value={hole.distances[teeBox.id as string] === null ? '' : hole.distances[teeBox.id as string] || ''}
                            onChange={(e) => teeBox.id && updateHoleDistance(index, teeBox.id, e.target.value)}
                            InputProps={{ 
                              inputProps: { 
                                pattern: '[0-9]*',
                                style: { textAlign: 'right' }
                              },
                              endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>yds</Typography>
                            }}
                            sx={{ 
                              width: '100px',
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: 
                                  hole.distances[teeBox.id as string] !== 
                                  holes.find(h => h.id === hole.id)?.distances[teeBox.id as string] 
                                    ? 'rgba(255, 152, 0, 0.1)' 
                                    : 'transparent'
                              }
                            }}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
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
                      onChange={(e) => handleHoleDialogDistanceChange(teeBox.id, e.target.value)}
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