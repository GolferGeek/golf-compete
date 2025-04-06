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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header Section */}
      <Box sx={{ 
        mb: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2
      }}>
        <Link href="/events" passHref>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            color="primary"
            sx={{ mr: 2 }}
          >
            Back to Events
          </Button>
        </Link>
        <Link href={`/events/${eventId}`} passHref>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            color="primary"
            sx={{ mr: 2 }}
          >
            Back to Event
          </Button>
        </Link>
        <Breadcrumbs sx={{ flexGrow: 1 }}>
          <Typography color="text.primary">Participants</Typography>
        </Breadcrumbs>
      </Box>

      {/* Title Section */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              Manage Event Participants
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'} registered
              {event.max_participants ? ` (max: ${event.max_participants})` : ''}
            </Typography>
          </Box>
          {participants.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setAddDialogOpen(true)}
              disabled={availableUsers.length === 0}
              sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
            >
              Add Participant
            </Button>
          )}
        </Box>
        
        {participants.length === 0 && (
          <Box sx={{ 
            mt: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2 
          }}>
            <Typography variant="body1" color="text.secondary">
              No participants have been registered for this event yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setAddDialogOpen(true)}
              disabled={availableUsers.length === 0}
            >
              Add First Participant
            </Button>
          </Box>
        )}
      </Paper>

      {participants.length > 0 && (
        <>
          {/* Desktop view */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper elevation={2}>
              <TableContainer>
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
                      <TableRow key={participant.id} hover>
                        <TableCell>
                          <Typography variant="body1">
                            {participant.first_name} {participant.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>{participant.username}</TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={participant.status}
                              onChange={(e) => handleStatusChange(participant.id, e.target.value as any)}
                              variant="outlined"
                              sx={{
                                '& .MuiSelect-select': {
                                  py: 1,
                                  bgcolor: 
                                    participant.status === 'confirmed' ? 'success.lighter' :
                                    participant.status === 'registered' ? 'info.lighter' :
                                    participant.status === 'withdrawn' ? 'error.lighter' :
                                    participant.status === 'no_show' ? 'warning.lighter' :
                                    'transparent'
                                }
                              }}
                            >
                              <MenuItem value="registered">Registered</MenuItem>
                              <MenuItem value="confirmed">Confirmed</MenuItem>
                              <MenuItem value="withdrawn">Withdrawn</MenuItem>
                              <MenuItem value="no_show">No Show</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          {participant.handicap_index !== null ? participant.handicap_index.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleDeleteClick(participant.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* Mobile view */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {participants.map((participant) => (
              <Paper key={participant.id} elevation={2} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {participant.first_name} {participant.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body2">
                        HCP: {participant.handicap_index !== null ? participant.handicap_index.toFixed(1) : 'N/A'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {participant.username}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => handleDeleteClick(participant.id)}
                    color="error"
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <FormControl size="small" fullWidth>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Status
                  </Typography>
                  <Select
                    value={participant.status}
                    onChange={(e) => handleStatusChange(participant.id, e.target.value as any)}
                    variant="outlined"
                    sx={{
                      '& .MuiSelect-select': {
                        py: 1,
                        bgcolor: 
                          participant.status === 'confirmed' ? 'success.lighter' :
                          participant.status === 'registered' ? 'info.lighter' :
                          participant.status === 'withdrawn' ? 'error.lighter' :
                          participant.status === 'no_show' ? 'warning.lighter' :
                          'transparent'
                      }
                    }}
                  >
                    <MenuItem value="registered">Registered</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="withdrawn">Withdrawn</MenuItem>
                    <MenuItem value="no_show">No Show</MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            ))}
          </Box>
        </>
      )}

      {/* Add Participant Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Participant</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Player</InputLabel>
              <Select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                label="Select Player"
              >
                {availableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.username})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Handicap Index"
              type="number"
              value={handicapIndex}
              onChange={(e) => setHandicapIndex(e.target.value)}
              inputProps={{ step: 0.1 }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddParticipant}
            variant="contained"
            color="primary"
            disabled={!selectedUserId || addingParticipant}
          >
            {addingParticipant ? <CircularProgress size={24} /> : 'Add Participant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Remove Participant</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to remove this participant from the event? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deletingParticipant}
          >
            {deletingParticipant ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 