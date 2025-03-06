'use client';

import React, { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { SelectChangeEvent } from '@mui/material/Select';

// Club types
const clubTypes = [
  'driver',
  'wood',
  'hybrid',
  'iron',
  'wedge',
  'putter'
];

// Brands
const clubBrands = [
  'Titleist',
  'Callaway',
  'TaylorMade',
  'Ping',
  'Cobra',
  'Mizuno',
  'Cleveland',
  'Srixon',
  'Wilson',
  'PXG',
  'Other'
];

// TypeScript interfaces
type ClubRow = {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  model: string;
  type: string;
  loft: number | null;
  shaft: string | null;
  flex: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

interface Club extends ClubRow {}

interface FormData {
  name: string;
  brand: string;
  model: string;
  type: string;
  loft?: string;
  shaft?: string;
  flex?: string;
  notes?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function ClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [open, setOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand: '',
    model: '',
    type: '',
    loft: '',
    shaft: '',
    flex: '',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(true);

  // Load clubs from database
  useEffect(() => {
    const loadClubs = async () => {
      if (!user) return;

      try {
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('*')
          .eq('user_id', user.id)
          .order('model');

        if (clubsError) throw clubsError;
        setClubs(clubsData?.map(row => row as ClubRow) || []);
        setLoading(false);
      } catch (error) {
        console.error('Error loading clubs:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load clubs',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    loadClubs();
  }, [user]);

  const handleClickOpen = () => {
    setFormData({
      name: '',
      brand: '',
      model: '',
      type: '',
      loft: '',
      shaft: '',
      flex: '',
      notes: ''
    });
    setEditingClub(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingClub(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const name = e.target.name as keyof FormData;
    const value = e.target.value as string;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      // Validate form
      if (!formData.name || !formData.brand || !formData.model || !formData.type) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        });
        return;
      }

      const clubData = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        type: formData.type.toLowerCase(),
        loft: formData.loft ? parseFloat(formData.loft) : null,
        shaft: formData.shaft || null,
        flex: formData.flex || null,
        notes: formData.notes || null
      };

      if (editingClub) {
        // Update existing club
        const { error } = await supabase
          .from('clubs')
          .update(clubData)
          .eq('id', editingClub.id);

        if (error) throw error;

        // Update local state
        setClubs(clubs.map(club => 
          club.id === editingClub.id 
            ? { ...club, ...clubData }
            : club
        ));

        setSnackbar({
          open: true,
          message: 'Club updated successfully',
          severity: 'success'
        });
      } else {
        // Create new club
        const { data, error } = await supabase
          .from('clubs')
          .insert([{
            user_id: user.id,
            ...clubData
          }])
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setClubs(prevClubs => [...prevClubs, data as ClubRow]);

        setSnackbar({
          open: true,
          message: 'Club added successfully',
          severity: 'success'
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving club:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save club',
        severity: 'error'
      });
    }
  };

  const handleEdit = (club: Club) => {
    setFormData({
      name: club.name,
      brand: club.brand,
      model: club.model,
      type: club.type,
      loft: club.loft?.toString() || '',
      shaft: club.shaft || '',
      flex: club.flex || '',
      notes: club.notes || ''
    });
    setEditingClub(club);
    setOpen(true);
  };

  const handleDelete = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (error) throw error;

      setClubs(clubs.filter(club => club.id !== clubId));
      setSnackbar({
        open: true,
        message: 'Club deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting club:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete club',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <ProtectedRoute>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button 
              component={Link} 
              href="/profile" 
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 2 }}
            >
              Back to Profile
            </Button>
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom>
            My Golf Clubs
          </Typography>
          
          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Manage your golf clubs
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleClickOpen}
              >
                Add New Club
              </Button>
            </Box>
            
            {clubs.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                You haven&apos;t added any clubs yet. Click the &quot;Add New Club&quot; button to get started.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {clubs.map((club) => (
                  <Grid item xs={12} sm={6} md={4} key={club.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" component="div">
                            {club.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {club.type.charAt(0).toUpperCase() + club.type.slice(1)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {club.brand} {club.model}
                          {club.loft && ` • ${club.loft}°`}
                        </Typography>
                        
                        {(club.shaft || club.flex) && (
                          <Typography variant="body2" color="text.secondary">
                            {[club.shaft, club.flex].filter(Boolean).join(' • ')}
                          </Typography>
                        )}
                        
                        {club.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {club.notes}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <IconButton 
                          aria-label="edit" 
                          onClick={() => handleEdit(club)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          aria-label="delete" 
                          onClick={() => handleDelete(club.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Box>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingClub ? 'Edit Club' : 'Add New Club'}</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Club Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel id="brand-label">Brand</InputLabel>
                    <Select
                      labelId="brand-label"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      label="Brand"
                      onChange={handleInputChange}
                    >
                      {clubBrands.map((brand) => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel id="type-label">Club Type</InputLabel>
                    <Select
                      labelId="type-label"
                      id="type"
                      name="type"
                      value={formData.type}
                      label="Club Type"
                      onChange={handleInputChange}
                    >
                      {clubTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="model"
                    label="Model"
                    name="model"
                    required
                    value={formData.model}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="loft"
                    label="Loft"
                    name="loft"
                    type="number"
                    value={formData.loft}
                    onChange={handleInputChange}
                    InputProps={{
                      endAdornment: <Typography variant="caption">°</Typography>
                    }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="shaft"
                    label="Shaft"
                    name="shaft"
                    value={formData.shaft}
                    onChange={handleInputChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="flex"
                    label="Flex"
                    name="flex"
                    value={formData.flex}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <TextField
                margin="normal"
                fullWidth
                id="notes"
                label="Notes"
                name="notes"
                multiline
                rows={2}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingClub ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ProtectedRoute>
  );
} 