"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  getSeriesById, 
} from '@/lib/series';
import { 
  getSeriesParticipants, 
  getNonSeriesParticipants, 
  addParticipantToSeries, 
  updateSeriesParticipantRole, 
  updateSeriesParticipantStatus, 
  removeParticipantFromSeries 
} from '@/lib/participants';

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface Participant {
  id: string;
  user_id: string;
  role: 'admin' | 'participant';
  status: 'active' | 'withdrawn' | 'invited';
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  handicap?: number;
}

interface SeriesParticipantsPageProps {
  params: {
    id: string;
  };
}

export default function SeriesParticipantsPage({ params }: SeriesParticipantsPageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any) as { id: string };
  const seriesId = unwrappedParams.id;
  
  const [series, setSeries] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'participant'>('participant');
  const [addingParticipant, setAddingParticipant] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<string | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load series details
        const seriesData = await getSeriesById(seriesId);
        setSeries(seriesData);
        
        // Load participants
        const participantsData = await getSeriesParticipants(seriesId);
        setParticipants(participantsData as unknown as Participant[]);
        
        // Load available users
        const availableUsersData = await getNonSeriesParticipants(seriesId);
        setAvailableUsers(availableUsersData as unknown as User[]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [seriesId]);

  const handleAddParticipant = async () => {
    if (!selectedUserId) return;
    
    try {
      setAddingParticipant(true);
      await addParticipantToSeries(seriesId, selectedUserId, selectedRole);
      
      // Reload participants and available users
      const participantsData = await getSeriesParticipants(seriesId);
      setParticipants(participantsData as unknown as Participant[]);
      
      const availableUsersData = await getNonSeriesParticipants(seriesId);
      setAvailableUsers(availableUsersData as unknown as User[]);
      
      // Close dialog and reset form
      setAddDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('participant');
    } catch (err) {
      console.error('Error adding participant:', err);
      setError('Failed to add participant. Please try again later.');
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleRoleChange = async (participantId: string, newRole: 'admin' | 'participant') => {
    try {
      await updateSeriesParticipantRole(participantId, newRole);
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, role: newRole } : p)
      );
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role. Please try again later.');
    }
  };

  const handleStatusChange = async (participantId: string, newStatus: 'active' | 'withdrawn' | 'invited') => {
    try {
      await updateSeriesParticipantStatus(participantId, newStatus);
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, status: newStatus } : p)
      );
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again later.');
    }
  };

  const handleDeleteClick = (participantId: string) => {
    setParticipantToDelete(participantId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!participantToDelete) return;
    
    try {
      setDeletingParticipant(true);
      await removeParticipantFromSeries(participantToDelete);
      
      // Update local state
      setParticipants(prev => prev.filter(p => p.id !== participantToDelete));
      
      // Reload available users
      const availableUsersData = await getNonSeriesParticipants(seriesId);
      setAvailableUsers(availableUsersData as unknown as User[]);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setParticipantToDelete(null);
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant. Please try again later.');
    } finally {
      setDeletingParticipant(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!series) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Series not found.</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/admin/series')}
          sx={{ mt: 2 }}
        >
          Back to Series
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/admin" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Admin
            </MuiLink>
          </Link>
          <Link href="/admin/series" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Series
            </MuiLink>
          </Link>
          <Link href={`/admin/series/${seriesId}`} passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              {series.name}
            </MuiLink>
          </Link>
          <Typography color="text.primary">Participants</Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Participants for {series.name}
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/admin/series/${seriesId}`)}
            sx={{ mr: 2 }}
          >
            Back to Series
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddDialogOpen(true)}
            disabled={availableUsers.length === 0}
          >
            Add Participant
          </Button>
        </Box>
      </Box>

      {participants.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No participants have been added to this series yet.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    {participant.first_name} {participant.last_name}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={participant.role}
                        onChange={(e) => handleRoleChange(participant.id, e.target.value as 'admin' | 'participant')}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="participant">Participant</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={participant.status}
                        onChange={(e) => handleStatusChange(participant.id, e.target.value as 'active' | 'withdrawn' | 'invited')}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="withdrawn">Withdrawn</MenuItem>
                        <MenuItem value="invited">Invited</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteClick(participant.id)}
                      aria-label="delete participant"
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

      {/* Add Participant Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Participant to Series</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="user-select-label">User</InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value as string)}
                label="User"
              >
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'participant')}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="participant">Participant</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddParticipant} 
            variant="contained" 
            color="primary"
            disabled={!selectedUserId || addingParticipant}
          >
            {addingParticipant ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Participant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this participant from the series?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={deletingParticipant}
          >
            {deletingParticipant ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 