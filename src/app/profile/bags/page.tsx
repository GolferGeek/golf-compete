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
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createClient } from '@/lib/supabase/client';
import BagHandicapOverview from '@/components/handicap/BagHandicapOverview';

// TypeScript interfaces
interface BagData {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  handicap: number | null;
  bag_clubs?: { club_id: string }[];
}

type BagRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_default: boolean;
  handicap?: number;
  club_ids?: string[];
  bag_clubs?: {
    club_id: string;
  }[];
};

interface Bag extends BagRow {
  club_ids: string[];
}

type Database = {
  public: {
    Tables: {
      bags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      bag_clubs: {
        Row: {
          id: string;
          bag_id: string;
          club_id: string;
          created_at: string;
        };
      };
    };
  };
};

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
};

interface Club extends ClubRow {}

interface FormData {
  name: string;
  description: string;
  is_default: boolean;
  selectedClubs: string[];
  handicap?: number;
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
  const [editingBag, setEditingBag] = useState<Bag | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_default: false,
    selectedClubs: [],
    handicap: undefined
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(true);

  // Load bags and clubs from database
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        // Load bags with their clubs
        const { data, error: bagsError } = await supabase
          .from('bags')
          .select(`
            *,
            bag_clubs (
              club_id
            )
          `)
          .eq('user_id', user.id)
          .order('name');

        if (bagsError) throw bagsError;
        
        // Transform the data to include club_ids
        const transformedBags: Bag[] = ((data as any) || []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          name: row.name,
          description: row.description || '',
          is_default: row.is_default,
          handicap: typeof row.handicap === 'number' ? row.handicap : undefined,
          club_ids: (row.bag_clubs || []).map((bc: any) => bc.club_id)
        }));
        
        setBags(transformedBags);

        // Load clubs
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (clubsError) throw clubsError;
        setClubs(clubsData?.map(row => row as ClubRow) || []);

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load bags and clubs',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleClickOpen = () => {
    setFormData({
      name: '',
      description: '',
      is_default: false,
      selectedClubs: [],
      handicap: undefined
    });
    setEditingBag(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBag(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'club') {
      // Handle club checkbox changes
      const clubId = value;
      setFormData(prev => ({
        ...prev,
        selectedClubs: checked 
          ? [...prev.selectedClubs, clubId]
          : prev.selectedClubs.filter(id => id !== clubId)
      }));
    } else if (name === 'handicap') {
      // Handle handicap input
      setFormData(prev => ({
        ...prev,
        handicap: value === '' ? undefined : parseFloat(value)
      }));
    } else {
      // Handle other form inputs
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      // Validate form
      if (!formData.name.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a bag name',
          severity: 'error'
        });
        return;
      }

      const supabase = createClient();

      if (editingBag) {
        // Update existing bag
        const { error: bagError } = await supabase
          .from('bags')
          .update({
            name: formData.name,
            description: formData.description,
            is_default: formData.is_default,
            handicap: formData.handicap || null
          })
          .eq('id', editingBag.id);

        if (bagError) throw bagError;

        // Delete existing bag_clubs relationships
        const { error: deleteError } = await supabase
          .from('bag_clubs')
          .delete()
          .eq('bag_id', editingBag.id);

        if (deleteError) throw deleteError;

        // Insert new bag_clubs relationships
        const { error: insertError } = await supabase
          .from('bag_clubs')
          .insert(
            formData.selectedClubs.map(clubId => ({
              bag_id: editingBag.id,
              club_id: clubId
            }))
          );

        if (insertError) throw insertError;

        // Update local state
        setBags(prevBags => prevBags.map(bag => 
          bag.id === editingBag.id 
            ? { 
                ...bag, 
                name: formData.name,
                description: formData.description,
                is_default: formData.is_default,
                handicap: formData.handicap,
                club_ids: formData.selectedClubs
              }
            : bag
        ));

        setSnackbar({
          open: true,
          message: 'Bag updated successfully',
          severity: 'success'
        });
      } else {
        // Create new bag
        const { data: newBag, error: bagError } = await supabase
          .from('bags')
          .insert([{
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            is_default: formData.is_default,
            handicap: formData.handicap || null
          }])
          .select()
          .single();

        if (bagError) throw bagError;

        // Insert bag_clubs relationships
        const { error: insertError } = await supabase
          .from('bag_clubs')
          .insert(
            formData.selectedClubs.map(clubId => ({
              bag_id: newBag.id,
              club_id: clubId
            }))
          );

        if (insertError) throw insertError;

        // Update local state
        const bagWithClubs: Bag = {
          ...newBag,
          club_ids: formData.selectedClubs
        };
        setBags(prevBags => [...prevBags, bagWithClubs]);

        setSnackbar({
          open: true,
          message: 'Bag created successfully',
          severity: 'success'
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving bag:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save bag',
        severity: 'error'
      });
    }
  };

  const handleEdit = (bag: Bag) => {
    setFormData({
      name: bag.name,
      description: bag.description,
      is_default: bag.is_default,
      selectedClubs: bag.club_ids || [],
      handicap: typeof bag.handicap === 'number' ? bag.handicap : undefined
    });
    setEditingBag(bag);
    setOpen(true);
  };

  const handleDelete = async (bagId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bags')
        .delete()
        .eq('id', bagId);

      if (error) throw error;

      setBags(bags.filter(bag => bag.id !== bagId));
      setSnackbar({
        open: true,
        message: 'Bag deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting bag:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete bag',
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

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Golf Bags
        </Typography>
        <Typography>
          Please log in to view and manage your golf bags.
        </Typography>
      </Container>
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
          
          {/* Bag Handicap Overview */}
          <Box sx={{ mb: 4 }}>
            <BagHandicapOverview userId={user.id} />
          </Box>

          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Manage Golf Bags
          </Typography>

          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Manage your golf bags
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
                You haven&apos;t created any bags yet. Click the &quot;Add New Bag&quot; button to get started.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {bags.map((bag) => (
                  <Card key={bag.id}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" component="div">
                          {bag.name}
                        </Typography>
                        {bag.is_default && (
                          <Typography variant="caption" color="primary">
                            Default Bag
                          </Typography>
                        )}
                      </Box>
                      
                      {bag.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {bag.description}
                        </Typography>
                      )}

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Clubs in Bag ({bag.club_ids.length})
                      </Typography>

                      {bag.club_ids.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No clubs added to this bag yet.
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {clubs
                            .filter(club => bag.club_ids.includes(club.id))
                            .sort((a, b) => {
                              // Custom sort order for club types
                              const typeOrder = {
                                driver: 1,
                                wood: 2,
                                hybrid: 3,
                                iron: 4,
                                wedge: 5,
                                putter: 6
                              };
                              return (typeOrder[a.type as keyof typeof typeOrder] || 99) - 
                                     (typeOrder[b.type as keyof typeof typeOrder] || 99);
                            })
                            .map(club => (
                              <Paper
                                key={club.id}
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  minWidth: { xs: '100%', sm: '200px', md: '180px' },
                                  maxWidth: { xs: '100%', sm: '200px', md: '180px' },
                                  bgcolor: 'background.default'
                                }}
                              >
                                <GolfCourseIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                                <Box>
                                  <Typography variant="body2" noWrap>
                                    {club.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                    {club.type.charAt(0).toUpperCase() + club.type.slice(1)}
                                    {club.loft && ` • ${club.loft}°`}
                                  </Typography>
                                </Box>
                              </Paper>
                            ))}
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <IconButton 
                        aria-label="edit" 
                        onClick={() => handleEdit(bag)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        aria-label="delete" 
                        onClick={() => handleDelete(bag.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editingBag ? 'Edit Bag' : 'Add New Bag'}</DialogTitle>
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
                  label="Handicap"
                  name="handicap"
                  type="number"
                  inputProps={{ 
                    step: 0.1,
                    min: 0,
                    max: 54
                  }}
                  value={formData.handicap || ''}
                  onChange={handleInputChange}
                  helperText="Enter a value between 0 and 54"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_default}
                      onChange={handleInputChange}
                      name="is_default"
                    />
                  }
                  label="Set as default bag"
                  sx={{ mt: 2 }}
                />

                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                  Select Clubs
                </Typography>
                
                <Paper variant="outlined" sx={{ mt: 1, p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {clubs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No clubs available. Add some clubs first.
                    </Typography>
                  ) : (
                    <List dense>
                      {clubs.map((club) => (
                        <ListItem key={club.id} disablePadding>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.selectedClubs.includes(club.id)}
                                onChange={handleInputChange}
                                name="club"
                                value={club.id}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1">
                                  {club.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {club.brand} {club.model} • {club.type.charAt(0).toUpperCase() + club.type.slice(1)}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', ml: 0 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained">
                {editingBag ? 'Update' : 'Add'}
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
        </Box>
      </Container>
    </ProtectedRoute>
  );
} 