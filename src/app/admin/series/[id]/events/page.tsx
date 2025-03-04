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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';
import { getSeriesById } from '@/lib/series';
import { getEventsBySeries, getAllEvents, addEventToSeries, removeEventFromSeries } from '@/lib/events';

interface SeriesEventsPageProps {
  params: {
    id: string;
  };
}

export default function SeriesEventsPage({ params }: SeriesEventsPageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any) as { id: string };
  const seriesId = unwrappedParams.id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [series, setSeries] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [addingEvent, setAddingEvent] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load series details
        const seriesData = await getSeriesById(seriesId);
        setSeries(seriesData);
        
        // Load events
        const seriesEvents = await getEventsBySeries(seriesId);
        setEvents(seriesEvents);
        
        // Load available events
        const seriesEventIds = seriesEvents.map((e: any) => e.id);
        const allEvents = await getAllEvents();
        const availableEventsData = allEvents.filter((e: any) => !seriesEventIds.includes(e.id));
        setAvailableEvents(availableEventsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [seriesId]);

  const handleAddEvent = async () => {
    if (!selectedEventId) return;
    
    try {
      setAddingEvent(true);
      await addEventToSeries(seriesId, selectedEventId);
      
      // Reload events and available events
      const seriesEvents = await getEventsBySeries(seriesId);
      setEvents(seriesEvents);
      
      const seriesEventIds = seriesEvents.map((e: any) => e.id);
      const allEvents = await getAllEvents();
      const availableEventsData = allEvents.filter((e: any) => !seriesEventIds.includes(e.id));
      setAvailableEvents(availableEventsData);
      
      // Close dialog and reset form
      setAddDialogOpen(false);
      setSelectedEventId('');
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event. Please try again later.');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    
    try {
      setDeletingEvent(true);
      await removeEventFromSeries(seriesId, eventToDelete);
      
      // Reload events and available events
      const seriesEvents = await getEventsBySeries(seriesId);
      setEvents(seriesEvents);
      
      const seriesEventIds = seriesEvents.map((e: any) => e.id);
      const allEvents = await getAllEvents();
      const availableEventsData = allEvents.filter((e: any) => !seriesEventIds.includes(e.id));
      setAvailableEvents(availableEventsData);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (err) {
      console.error('Error removing event:', err);
      setError('Failed to remove event. Please try again later.');
    } finally {
      setDeletingEvent(false);
    }
  };

  const renderMobileView = () => {
    return (
      <Grid container spacing={2}>
        {events.map((event) => (
          <Grid item xs={12} key={event.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {event.name}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    color={
                      event.status === 'upcoming'
                        ? 'info'
                        : event.status === 'active'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={format(new Date(event.event_date), 'MMM d, yyyy')}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Format: {event.event_format}
                </Typography>
                {event.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {event.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1, pb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => router.push(`/admin/events/${event.id}/participants`)}
                >
                  Participants
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => router.push(`/admin/events/edit/${event.id}`)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteClick(event.id)}
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
              <TableCell>Date</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.name}</TableCell>
                <TableCell>{format(new Date(event.event_date), 'MMM d, yyyy')}</TableCell>
                <TableCell>{event.event_format}</TableCell>
                <TableCell>
                  <Chip
                    label={event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    color={
                      event.status === 'upcoming'
                        ? 'info'
                        : event.status === 'active'
                        ? 'success'
                        : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => router.push(`/admin/events/${event.id}/participants`)}
                    title="Manage Participants"
                  >
                    <PeopleIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => router.push(`/admin/events/edit/${event.id}`)}
                    title="Edit Event"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(event.id)}
                    title="Remove from Series"
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
          <Typography color="text.primary">Events</Typography>
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
          Events
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/admin/series/${seriesId}/events/new`)}
            fullWidth={isMobile}
          >
            Create Event
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={availableEvents.length === 0}
            fullWidth={isMobile}
          >
            Add Existing Event
          </Button>
        </Box>
      </Box>

      {events.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            No events found. Add events to get started.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => router.push(`/admin/series/${seriesId}/events/new`)}
            >
              Create Event
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              disabled={availableEvents.length === 0}
            >
              Add Existing Event
            </Button>
          </Box>
        </Paper>
      ) : (
        isMobile ? renderMobileView() : renderDesktopView()
      )}

      {/* Add Event Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Existing Event</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {availableEvents.length === 0 ? (
            <Typography>No available events to add.</Typography>
          ) : (
            <Box sx={{ minWidth: 250 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select an event to add to this series:
              </Typography>
              {availableEvents.map((event) => (
                <Button
                  key={event.id}
                  variant={selectedEventId === event.id ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setSelectedEventId(event.id)}
                  sx={{ mb: 1, display: 'block', width: '100%', textAlign: 'left' }}
                >
                  {event.name} - {format(new Date(event.event_date), 'MMM d, yyyy')}
                </Button>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddEvent}
            color="primary"
            disabled={!selectedEventId || addingEvent}
          >
            {addingEvent ? <CircularProgress size={24} /> : 'Add to Series'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Remove Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this event from the series? The event itself will not be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deletingEvent}
          >
            {deletingEvent ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 