"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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
  event_id: string;
  status: 'registered' | 'confirmed' | 'withdrawn' | 'no_show';
  registration_date: string;
  tee_time: string | null;
  starting_hole: number | null;
  group_number: number | null;
  handicap_index: number | null;
  first_name: string;
  last_name: string;
  username: string;
  handicap: number | null;
}

interface EventParticipantsProps {
  eventId: string;
}

export default function EventParticipants({ eventId }: EventParticipantsProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEventParticipants(eventId);
      setParticipants(data as Participant[]);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Failed to load participants. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const handleOpenAddDialog = async () => {
    try {
      setActionLoading(true);
      const users = await getNonEventParticipants(eventId);
      setAvailableUsers(users as User[]);
      setAddDialogOpen(true);
    } catch (err) {
      console.error('Error loading available users:', err);
      setError('Failed to load available users. Please try again later.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await addParticipantToEvent(eventId, selectedUser.id);
      await loadParticipants();
      setAddDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error adding participant:', err);
      setError('Failed to add participant. Please try again later.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (participantId: string, status: 'registered' | 'confirmed' | 'withdrawn' | 'no_show') => {
    try {
      await updateEventParticipantStatus(participantId, status);
      setParticipants(participants.map(p => 
        p.id === participantId ? { ...p, status } : p
      ));
    } catch (err) {
      console.error('Error updating participant status:', err);
      setError('Failed to update participant status. Please try again later.');
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      await removeParticipantFromEvent(participantId);
      setParticipants(participants.filter(p => p.id !== participantId));
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant. Please try again later.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'withdrawn':
        return 'error';
      case 'invited':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Event Participants
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Participant
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {participants.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No participants found for this event.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
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
                    <Chip 
                      label={participant.status} 
                      color={getStatusColor(participant.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                      <Select
                        value={participant.status}
                        onChange={(e) => handleStatusChange(participant.id, e.target.value as 'registered' | 'confirmed' | 'withdrawn' | 'no_show')}
                        size="small"
                      >
                        <MenuItem value="registered">Registered</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="withdrawn">Withdrawn</MenuItem>
                        <MenuItem value="no_show">No Show</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveParticipant(participant.id)}
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
      )}

      {/* Add Participant Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Participant</DialogTitle>
        <DialogContent>
          {actionLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {availableUsers.length === 0 ? (
                <Typography variant="body1" sx={{ my: 2 }}>
                  All users are already participants in this event.
                </Typography>
              ) : (
                <Autocomplete
                  options={availableUsers}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.username})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      fullWidth
                      margin="normal"
                    />
                  )}
                  value={selectedUser}
                  onChange={(_, newValue) => setSelectedUser(newValue)}
                  sx={{ mt: 2 }}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddParticipant} 
            color="primary" 
            disabled={!selectedUser || actionLoading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 