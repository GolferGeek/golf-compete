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
  TextField,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { getEventById } from '@/lib/events';
import { 
  getEventParticipants, 
  getNonEventParticipants, 
  addParticipantToEvent, 
  updateEventParticipantStatus, 
  removeParticipantFromEvent 
} from '@/lib/participants';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  handicap: number | null;
}

interface Participant {
  id: string;
  user_id: string;
  status: 'registered' | 'confirmed' | 'withdrawn' | 'no_show';
  handicap_index: number | null;
  first_name: string;
  last_name: string;
  username: string;
  handicap: number | null;
}

interface EventParticipantsPageProps {
  params: {
    id: string;
  };
}

export default function EventParticipantsPage({ params }: EventParticipantsPageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any) as { id: string };
  const eventId = unwrappedParams.id;
  
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [handicapIndex, setHandicapIndex] = useState<string>('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<string | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load event details
        const eventData = await getEventById(eventId);
        setEvent(eventData);
        
        // Load participants
        const participantsData = await getEventParticipants(eventId);
        setParticipants(participantsData as unknown as Participant[]);
        
        // Load available users
        const availableUsersData = await getNonEventParticipants(eventId);
        setAvailableUsers(availableUsersData as unknown as User[]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventId]);

  const handleAddParticipant = async () => {
    if (!selectedUserId) return;
    
    try {
      setAddingParticipant(true);
      await addParticipantToEvent(
        eventId, 
        selectedUserId, 
        handicapIndex ? parseFloat(handicapIndex) : undefined
      );
      
      // Reload participants and available users
      const participantsData = await getEventParticipants(eventId);
      setParticipants(participantsData as unknown as Participant[]);
      
      const availableUsersData = await getNonEventParticipants(eventId);
      setAvailableUsers(availableUsersData as unknown as User[]);
      
      // Close dialog and reset form
      setAddDialogOpen(false);
      setSelectedUserId('');
      setHandicapIndex('');
    } catch (err) {
      console.error('Error adding participant:', err);
      setError('Failed to add participant. Please try again later.');
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleStatusChange = async (participantId: string, newStatus: 'registered' | 'confirmed' | 'withdrawn' | 'no_show') => {
    try {
      await updateEventParticipantStatus(participantId, newStatus);
      
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
      await removeParticipantFromEvent(participantToDelete);
      
      // Update local state
      setParticipants(prev => prev.filter(p => p.id !== participantToDelete));
      setDeleteDialogOpen(false);
      setParticipantToDelete(null);
    } catch (err) {
      console.error('Error deleting participant:', err);
      setError('Failed to delete participant. Please try again later.');
    } finally {
      setDeletingParticipant(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Event not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.back()} aria-label="back">
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs>
          <Link href="/admin/events" passHref>
            <MuiLink component="span">Events</MuiLink>
          </Link>
          <Link href={`/admin/events/${eventId}`} passHref>
            <MuiLink component="span">{event.name}</MuiLink>
          </Link>
          <Typography color="text.primary">Participants</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Manage Event Participants
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddDialogOpen(true)}
          disabled={availableUsers.length === 0}
        >
          Add Participant
        </Button>
      </Box>

      {participants.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No participants have been registered for this event yet.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Handicap Index</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    {participant.first_name} {participant.last_name}
                  </TableCell>
                  <TableCell>{participant.username}</TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={participant.status}
                        onChange={(e) => handleStatusChange(participant.id, e.target.value as 'registered' | 'confirmed' | 'withdrawn' | 'no_show')}
                      >
                        <MenuItem value="registered">Registered</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="withdrawn">Withdrawn</MenuItem>
                        <MenuItem value="no_show">No Show</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>{participant.handicap_index || 'N/A'}</TableCell>
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
        <DialogTitle>Add Participant to Event</DialogTitle>
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
                    {user.first_name} {user.last_name} ({user.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Handicap Index"
              type="number"
              value={handicapIndex}
              onChange={(e) => setHandicapIndex(e.target.value)}
              inputProps={{ step: 0.1 }}
              helperText="Optional: Enter the player's handicap index"
            />
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
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this participant from the event?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deletingParticipant}
          >
            {deletingParticipant ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 