'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Autocomplete,
  MenuItem,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSeriesParticipants, inviteUsers, removeParticipant } from '@/api/competition/seriesParticipantService';
import { SeriesParticipant } from '@/types/series';
import { useAuth } from '@/contexts/AuthContext';
import { getProfilesWithEmail, getProfilesNotInSeries, ProfileWithEmail } from '@/lib/profileService';
import { Database } from '@/types/supabase';
import { Profile } from '@/types/profile';
import { getSeriesById } from '@/lib/series';
import { format } from 'date-fns';

type DbProfile = Database['public']['Tables']['profiles']['Row'];

interface Props {
  seriesId: string;
  initialParticipants?: SeriesParticipant[];
  initialAvailableUsers?: ProfileWithEmail[];
}

export default function SeriesParticipantsManagement({ 
  seriesId,
  initialParticipants = [],
  initialAvailableUsers = []
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [participants, setParticipants] = useState<SeriesParticipant[]>(initialParticipants);
  const [loading, setLoading] = useState(!initialParticipants.length);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<SeriesParticipant | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; label: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; label: string }[]>([]);
  const [selectedRole, setSelectedRole] = useState<'participant' | 'admin'>('participant');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAddingUsers, setIsAddingUsers] = useState(false);
  const [series, setSeries] = useState<any>(null);

  const loadParticipants = useCallback(async () => {
    if (!seriesId) {
      console.error('Series ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading participants for series:', seriesId);
      const [data, seriesData] = await Promise.all([
        getSeriesParticipants(seriesId),
        getSeriesById(seriesId)
      ]);
      console.log('Loaded participants:', data);
      console.log('Loaded series:', seriesData);
      setParticipants(data);
      setSeries(seriesData);
      setError(null);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Failed to load participants. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

  const loadAvailableUsers = useCallback(async () => {
    try {
      const profiles = await getProfilesNotInSeries(seriesId);
      const availableUserOptions = profiles.map(profile => ({
        id: profile.id,
        label: `${profile.first_name || ''} ${profile.last_name || ''} (${profile.user_email || ''})`,
      }));
      setAvailableUsers(availableUserOptions);
      setError(null);
    } catch (err) {
      console.error('Error loading available users:', err);
      // Don't set error here as it's not critical for the main functionality
    }
  }, [seriesId]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    if (!loading) {
      loadAvailableUsers();
    }
  }, [loadAvailableUsers, loading]);

  const handleInviteUsers = async () => {
    if (selectedUsers.length === 0) return;

    setIsAddingUsers(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Adding users:', selectedUsers);
      const userIds = selectedUsers.map(user => user.id);
      const result = await inviteUsers(seriesId, userIds, selectedRole);
      
      console.log('Add users result:', result);
      
      if (result.failed.length > 0) {
        if (result.success.length > 0) {
          const message = `Successfully added ${result.success.length} users to the series.`;
          console.log(message);
          setSuccessMessage(message);
          setError(`Failed to add ${result.failed.length} users. Please try again with those users.`);
          if (result.failed.length === 0) {
            setInviteDialogOpen(false);
            setSelectedUsers([]);
          }
        } else {
          const errorMsg = `Failed to add users. Please try again.`;
          console.log(errorMsg);
          setError(errorMsg);
        }
      } else {
        const message = `Successfully added ${result.success.length} users to the series.`;
        console.log(message);
        setSuccessMessage(message);
        setError(null);
        setInviteDialogOpen(false);
        setSelectedUsers([]);
      }

      console.log('Refreshing participants list...');
      await loadParticipants();
      console.log('Refreshing available users...');
      await loadAvailableUsers();
    } catch (err) {
      console.error('Error adding users:', err);
      setError('Failed to add users. Please try again later.');
    } finally {
      setIsAddingUsers(false);
    }
  };

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return;

    try {
      setError(null); // Clear any previous errors
      await removeParticipant(participantToRemove.id);
      await loadParticipants();
      await loadAvailableUsers();
      setRemoveDialogOpen(false);
      setParticipantToRemove(null);
    } catch (err) {
      console.error('Error removing participant:', err);
      setError('Failed to remove participant. Please try again later.');
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'invited':
        return 'warning';
      case 'withdrawn':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/series" color="inherit">
            Series
          </MuiLink>
          <MuiLink component={Link} href={`/series/${seriesId}`} color="inherit">
            {series?.name || 'Series Details'}
          </MuiLink>
          <Typography color="text.primary">Participants</Typography>
        </Breadcrumbs>
      </Box>

      {series && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {series.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {format(new Date(series.start_date), 'MMM d, yyyy')} - {format(new Date(series.end_date), 'MMM d, yyyy')}
          </Typography>
          {series.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {series.description}
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h5" component="h2">
          Participants
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            href={`/series/${seriesId}`}
          >
            Back to Series
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Add Participants
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {isMobile ? (
        <List>
          {participants.map((participant) => (
            <ListItem key={participant.id}>
              <ListItemText
                primary={`${participant.first_name} ${participant.last_name}`}
                secondary={
                  <Chip
                    label={participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                    color={getStatusChipColor(participant.status) as any}
                    size="small"
                  />
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => {
                    setParticipantToRemove(participant);
                    setRemoveDialogOpen(true);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Role</TableCell>
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
                    <Chip
                      label={participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                      color={getStatusChipColor(participant.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={participant.is_admin ? 'Admin' : 'Player'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setParticipantToRemove(participant);
                        setRemoveDialogOpen(true);
                      }}
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

      {/* Add Participants Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Participants</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={availableUsers}
              value={selectedUsers}
              onChange={(_, newValue) => setSelectedUsers(newValue)}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Users"
                  placeholder="Search users..."
                />
              )}
            />
            <TextField
              select
              fullWidth
              margin="normal"
              label="Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'participant' | 'admin')}
            >
              <MenuItem value="participant">Participant</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInviteUsers}
            variant="contained"
            disabled={selectedUsers.length === 0 || isAddingUsers}
          >
            {isAddingUsers ? 'Adding...' : 'Add Selected Users'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Participant Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={() => {
          setRemoveDialogOpen(false);
          setParticipantToRemove(null);
        }}
      >
        <DialogTitle>Remove Participant</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {participantToRemove?.first_name} {participantToRemove?.last_name} from this series?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRemoveDialogOpen(false);
            setParticipantToRemove(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleRemoveParticipant} color="error" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 