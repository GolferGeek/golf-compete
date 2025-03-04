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
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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

  const renderMobileView = () => {
    return (
      <Grid container spacing={2}>
        {participants.map((participant) => (
          <Grid item xs={12} key={participant.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {participant.first_name} {participant.last_name}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={participant.role === 'admin' ? 'Admin' : 'Participant'}
                    color={participant.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                    color={
                      participant.status === 'active'
                        ? 'success'
                        : participant.status === 'invited'
                        ? 'info'
                        : 'default'
                    }
                    size="small"
                  />
                </Box>
                {participant.handicap !== undefined && (
                  <Typography variant="body2" color="text.secondary">
                    Handicap: {participant.handicap}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1, pb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={participant.role}
                    label="Role"
                    onChange={(e) => handleRoleChange(participant.id, e.target.value as 'admin' | 'participant')}
                    size="small"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="participant">Participant</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={participant.status}
                    label="Status"
                    onChange={(e) => handleStatusChange(participant.id, e.target.value as 'active' | 'withdrawn' | 'invited')}
                    size="small"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="withdrawn">Withdrawn</MenuItem>
                    <MenuItem value="invited">Invited</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeleteClick(participant.id)}
                >
                  Remove
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderDesktopView = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Handicap</TableCell>
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
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={participant.role}
                      onChange={(e) => handleRoleChange(participant.id, e.target.value as 'admin' | 'participant')}
                      size="small"
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="participant">Participant</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={participant.status}
                      onChange={(e) => handleStatusChange(participant.id, e.target.value as 'active' | 'withdrawn' | 'invited')}
                      size="small"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="withdrawn">Withdrawn</MenuItem>
                      <MenuItem value="invited">Invited</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>{participant.handicap !== undefined ? participant.handicap : 'N/A'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(participant.id)}
                    title="Remove Participant"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
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

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          Participants
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddDialogOpen(true)}
          disabled={availableUsers.length === 0}
          fullWidth={isMobile}
        >
          Add Participant
        </Button>
      </Box>

      {participants.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            No participants found. Add participants to get started.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setAddDialogOpen(true)}
            disabled={availableUsers.length === 0}
          >
            Add Participant
          </Button>
        </Paper>
      ) : (
        isMobile ? renderMobileView() : renderDesktopView()
      )}

      {/* Add Participant Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Participant</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {availableUsers.length === 0 ? (
            <Typography>No available users to add.</Typography>
          ) : (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>User</InputLabel>
                <Select
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
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'participant')}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="participant">Participant</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddParticipant}
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