"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Link,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';
import { getAllEvents, deleteEvent } from '@/lib/events';
import { Event, EventStatus } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';

export default function EventsManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const eventsData = await getAllEvents();
        setEvents(eventsData as unknown as Event[]);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const handleCreateEvent = () => {
    router.push('/admin/events/new');
  };

  const handleEditEvent = (eventId: string) => {
    router.push(`/admin/events/${eventId}/edit`);
  };

  const handleManageParticipants = (eventId: string) => {
    router.push(`/admin/events/${eventId}/participants`);
  };

  const handleDeleteEvent = (id: string) => {
    setEventIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventIdToDelete) return;

    try {
      await deleteEvent(eventIdToDelete);
      setEvents(events.filter(e => e.id !== eventIdToDelete));
      setDeleteDialogOpen(false);
      setEventIdToDelete(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again later.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEventIdToDelete(null);
  };

  const getStatusChipColor = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/admin/events/${eventId}`);
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 2, sm: 0 },
          mb: 3 
        }}>
          <Typography variant="h5" component="h1" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            Events Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateEvent}
            fullWidth={false}
            sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
          >
            Create Event
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {events.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              No events found. Create your first event to get started.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateEvent}
            >
              Create Event
            </Button>
          </Paper>
        ) : (
          <>
            {/* Desktop view */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Course</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Link
                            component="button"
                            onClick={() => handleViewEvent(event.id)}
                            sx={{ textAlign: 'left' }}
                          >
                            {event.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {(event as any).courses?.name || 'Unknown Course'}
                        </TableCell>
                        <TableCell>
                          {event.event_format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                            color={getStatusChipColor(event.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewEvent(event.id)}
                            size="small"
                            title="View Event"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleManageParticipants(event.id)}
                            size="small"
                            title="Manage Participants"
                          >
                            <PeopleIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteEvent(event.id)}
                            size="small"
                            title="Delete Event"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Mobile view */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {events.map((event) => (
                  <Paper key={event.id} sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {event.name}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Date:
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(event.event_date), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Course:
                          </Typography>
                          <Typography variant="body1">
                            {(event as any).courses?.name || 'Unknown Course'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Format:
                          </Typography>
                          <Typography variant="body1">
                            {event.event_format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Status:
                          </Typography>
                          <Chip
                            label={event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                            color={getStatusChipColor(event.status) as any}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Divider />
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: 1,
                      mt: 2 
                    }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleViewEvent(event.id)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<PeopleIcon />}
                        onClick={() => handleManageParticipants(event.id)}
                      >
                        Participants
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this event? This action cannot be undone and will remove all associated participant data and results.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminAuthGuard>
  );
} 