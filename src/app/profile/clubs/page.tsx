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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SelectChangeEvent } from '@mui/material/Select';

// Club types
const clubTypes = [
  'Driver',
  'Wood',
  'Hybrid',
  'Iron',
  'Wedge',
  'Putter',
  'Other'
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
interface Club {
  id: string;
  name: string;
  brand: string;
  type: string;
  loft?: string;
  notes?: string;
  dateAdded: string;
}

interface FormData {
  name: string;
  brand: string;
  type: string;
  loft: string;
  notes: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function ClubsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [open, setOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand: '',
    type: '',
    loft: '',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check if user has multiple_clubs_sets flag set
  useEffect(() => {
    if (profile && !profile.multiple_clubs_sets) {
      // Redirect to dashboard if user doesn't have multiple_clubs_sets flag set
      router.push('/dashboard');
    }
  }, [profile, router]);

  // Load clubs from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const savedClubs = localStorage.getItem(`golf-clubs-${user.id}`);
      if (savedClubs) {
        setClubs(JSON.parse(savedClubs));
      }
    }
  }, [user]);

  // Save clubs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && user && clubs.length > 0) {
      localStorage.setItem(`golf-clubs-${user.id}`, JSON.stringify(clubs));
    }
  }, [clubs, user]);

  // If user doesn't have multiple_clubs_sets flag set, show message and return
  if (profile && !profile.multiple_clubs_sets) {
    return null; // Return null as we're redirecting
  }

  const handleClickOpen = () => {
    setFormData({
      name: '',
      brand: '',
      type: '',
      loft: '',
      notes: ''
    });
    setEditingClub(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const name = e.target.name as keyof FormData;
    const value = e.target.value as string;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.name || !formData.brand || !formData.type) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    if (editingClub !== null) {
      // Update existing club
      const updatedClubs = clubs.map((club, index) => 
        index === editingClub ? { ...club, ...formData } : club
      );
      setClubs(updatedClubs);
      setSnackbar({
        open: true,
        message: 'Club updated successfully',
        severity: 'success'
      });
    } else {
      // Add new club
      const newClub: Club = {
        ...formData,
        id: Date.now().toString(), // Simple unique ID
        dateAdded: new Date().toISOString()
      };
      setClubs([...clubs, newClub]);
      setSnackbar({
        open: true,
        message: 'Club added successfully',
        severity: 'success'
      });
    }
    
    // Close the dialog
    setOpen(false);
  };

  const handleEdit = (index: number) => {
    const clubToEdit = clubs[index];
    setFormData({
      name: clubToEdit.name,
      brand: clubToEdit.brand,
      type: clubToEdit.type,
      loft: clubToEdit.loft || '',
      notes: clubToEdit.notes || ''
    });
    setEditingClub(index);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedClubs = clubs.filter((_, i) => i !== index);
    setClubs(updatedClubs);
    setSnackbar({
      open: true,
      message: 'Club removed successfully',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <ProtectedRoute>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          {/* Back button */}
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
                Manage your golf clubs and equipment
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
                You haven't added any clubs yet. Click the "Add New Club" button to get started.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {clubs.map((club, index) => (
                  <Grid item xs={12} sm={6} md={4} key={club.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" gutterBottom>
                          {club.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {club.brand} • {club.type}
                        </Typography>
                        {club.loft && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Loft: {club.loft}°
                          </Typography>
                        )}
                        {club.notes && (
                          <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2">
                              {club.notes}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                      <CardActions>
                        <IconButton 
                          aria-label="edit" 
                          size="small" 
                          onClick={() => handleEdit(index)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          aria-label="delete" 
                          size="small" 
                          onClick={() => handleDelete(index)}
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

        {/* Add/Edit Club Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingClub !== null ? 'Edit Club' : 'Add New Club'}</DialogTitle>
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
                        <MenuItem key={brand} value={brand}>{brand}</MenuItem>
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
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <TextField
                margin="normal"
                fullWidth
                id="loft"
                label="Loft (degrees)"
                name="loft"
                type="number"
                value={formData.loft}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, max: 80 } }}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="notes"
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingClub !== null ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
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