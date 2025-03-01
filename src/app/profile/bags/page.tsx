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
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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

interface Bag {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  clubIds: string[];
  handicap?: number | null;
  dateAdded: string;
}

interface FormData {
  name: string;
  description: string;
  isDefault: boolean;
  clubIds: string[];
  handicap: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export default function BagsPage() {
  const { user } = useAuth();
  const [bags, setBags] = useState<Bag[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [open, setOpen] = useState(false);
  const [editingBag, setEditingBag] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isDefault: false,
    clubIds: [],
    handicap: ''
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load clubs and bags from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Load clubs
      const savedClubs = localStorage.getItem(`golf-clubs-${user.id}`);
      if (savedClubs) {
        setClubs(JSON.parse(savedClubs));
      }

      // Load bags
      const savedBags = localStorage.getItem(`golf-bags-${user.id}`);
      if (savedBags) {
        setBags(JSON.parse(savedBags));
      }
    }
  }, [user]);

  // Save bags to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && user && bags.length > 0) {
      localStorage.setItem(`golf-bags-${user.id}`, JSON.stringify(bags));
    }
  }, [bags, user]);

  const handleClickOpen = () => {
    setFormData({
      name: '',
      description: '',
      isDefault: false,
      clubIds: [],
      handicap: ''
    });
    setEditingBag(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleClubToggle = (clubId: string) => {
    const currentClubIds = [...formData.clubIds];
    const currentIndex = currentClubIds.indexOf(clubId);
    
    if (currentIndex === -1) {
      // Add the club
      currentClubIds.push(clubId);
    } else {
      // Remove the club
      currentClubIds.splice(currentIndex, 1);
    }

    setFormData({
      ...formData,
      clubIds: currentClubIds
    });
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.name) {
      setSnackbar({
        open: true,
        message: 'Please provide a name for your bag',
        severity: 'error'
      });
      return;
    }

    // Validate handicap if provided
    if (formData.handicap && isNaN(Number(formData.handicap))) {
      setSnackbar({
        open: true,
        message: 'Handicap must be a number',
        severity: 'error'
      });
      return;
    }

    // If this bag is set as default, update other bags to not be default
    let updatedBags = [...bags];
    if (formData.isDefault) {
      updatedBags = updatedBags.map(bag => ({
        ...bag,
        isDefault: false
      }));
    }

    if (editingBag !== null) {
      // Update existing bag
      updatedBags = updatedBags.map((bag, index) => 
        index === editingBag ? { 
          ...bag, 
          name: formData.name,
          description: formData.description,
          isDefault: formData.isDefault,
          clubIds: formData.clubIds,
          handicap: formData.handicap ? parseFloat(formData.handicap) : null
        } : bag
      );
      setBags(updatedBags);
      setSnackbar({
        open: true,
        message: 'Bag updated successfully',
        severity: 'success'
      });
    } else {
      // Add new bag
      const newBag: Bag = {
        id: Date.now().toString(), // Simple unique ID
        name: formData.name,
        description: formData.description,
        isDefault: formData.isDefault,
        clubIds: formData.clubIds,
        handicap: formData.handicap ? parseFloat(formData.handicap) : null,
        dateAdded: new Date().toISOString()
      };
      setBags([...updatedBags, newBag]);
      setSnackbar({
        open: true,
        message: 'Bag added successfully',
        severity: 'success'
      });
    }
    
    // Close the dialog
    setOpen(false);
  };

  const handleEdit = (index: number) => {
    const bagToEdit = bags[index];
    setFormData({
      name: bagToEdit.name,
      description: bagToEdit.description,
      isDefault: bagToEdit.isDefault,
      clubIds: bagToEdit.clubIds,
      handicap: bagToEdit.handicap !== null && bagToEdit.handicap !== undefined ? String(bagToEdit.handicap) : ''
    });
    setEditingBag(index);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const updatedBags = bags.filter((_, i) => i !== index);
    setBags(updatedBags);
    setSnackbar({
      open: true,
      message: 'Bag removed successfully',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Get club names for a bag
  const getClubsForBag = (bag: Bag) => {
    return clubs.filter(club => bag.clubIds.includes(club.id));
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
            My Golf Bags
          </Typography>
          
          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Manage your golf bags and club sets
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleClickOpen}
              >
                Add New Bag
              </Button>
            </Box>
            
            {bags.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                You haven't created any bags yet. Click the "Add New Bag" button to get started.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {bags.map((bag, index) => {
                  const bagClubs = getClubsForBag(bag);
                  return (
                    <Grid item xs={12} sm={6} key={bag.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" component="div" gutterBottom>
                              {bag.name}
                            </Typography>
                            {bag.isDefault && (
                              <Typography variant="caption" color="primary">
                                Default Bag
                              </Typography>
                            )}
                          </Box>
                          
                          {bag.description && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {bag.description}
                            </Typography>
                          )}

                          {bag.handicap !== null && bag.handicap !== undefined && (
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Handicap:</strong> {bag.handicap}
                            </Typography>
                          )}
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Typography variant="subtitle2" gutterBottom>
                            Clubs in this bag ({bagClubs.length}):
                          </Typography>
                          
                          {bagClubs.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No clubs added to this bag yet.
                            </Typography>
                          ) : (
                            <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
                              {bagClubs.map((club) => (
                                <ListItem key={club.id}>
                                  <ListItemIcon sx={{ minWidth: '30px' }}>
                                    <GolfCourseIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={club.name} 
                                    secondary={`${club.brand} • ${club.type}${club.loft ? ` • ${club.loft}°` : ''}`} 
                                  />
                                </ListItem>
                              ))}
                            </List>
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
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Box>

        {/* Add/Edit Bag Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editingBag !== null ? 'Edit Bag' : 'Add New Bag'}</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Bag Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
              />
              
              <TextField
                margin="normal"
                fullWidth
                id="handicap"
                label="Bag Handicap"
                name="handicap"
                type="number"
                value={formData.handicap}
                onChange={handleInputChange}
                helperText="Leave blank to use your profile handicap"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    name="isDefault"
                  />
                }
                label="Set as default bag"
                sx={{ mt: 2, mb: 2 }}
              />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Select clubs for this bag:
              </Typography>
              
              {clubs.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You haven't added any clubs yet. <Link href="/profile/clubs">Add some clubs</Link> first.
                </Alert>
              ) : (
                <Paper variant="outlined" sx={{ mt: 2, p: 2, maxHeight: '300px', overflow: 'auto' }}>
                  <List dense>
                    {clubs.map((club) => (
                      <ListItem key={club.id} disablePadding>
                        <FormControlLabel
                          control={
                            <Checkbox
                              edge="start"
                              checked={formData.clubIds.indexOf(club.id) !== -1}
                              onChange={() => handleClubToggle(club.id)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">{club.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {club.brand} • {club.type}{club.loft ? ` • ${club.loft}°` : ''}
                              </Typography>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingBag !== null ? 'Update' : 'Add'}
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