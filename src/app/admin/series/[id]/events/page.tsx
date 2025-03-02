"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  
  const [series, setSeries] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [eventOrder, setEventOrder] = useState<number>(1);
  const [pointsMultiplier, setPointsMultiplier] = useState<number>(1);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [eventToRemove, setEventToRemove] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load series details
        const seriesData = await getSeriesById(seriesId);
        setSeries(seriesData);
        
        // Load events for this series
        const seriesEvents = await getEventsBySeries(seriesId);
        setEvents(seriesEvents);
        
        // Load all events to find available ones
        const allEvents = await getAllEvents();
        const seriesEventIds = seriesEvents.map((e: any) => e.id);
        const filteredEvents = allEvents.filter((e: any) => !seriesEventIds.includes(e.id));
        setAvailableEvents(filteredEvents);
      } catch (err) {
        console.error('Error loading series data:', err);
        setError('Failed to load series data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [seriesId]);

  const handleAddEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await addEventToSeries(seriesId, selectedEvent, eventOrder, pointsMultiplier);
      
      // Refresh the events list
      const seriesEvents = await getEventsBySeries(seriesId);
      setEvents(seriesEvents);
      
      // Update available events
      const allEvents = await getAllEvents();
      const seriesEventIds = seriesEvents.map((e: any) => e.id);
      const filteredEvents = allEvents.filter((e: any) => !seriesEventIds.includes(e.id));
      setAvailableEvents(filteredEvents);
      
      // Reset form and close dialog
      setSelectedEvent('');
      setEventOrder(events.length + 1);
      setPointsMultiplier(1);
      setAddDialogOpen(false);
    } catch (err) {
      console.error('Error adding event to series:', err);
      setError('Failed to add event to series. Please try again later.');
    }
  };

  const handleRemoveEvent = async () => {
    if (!eventToRemove) return;
    
    try {
      await removeEventFromSeries(seriesId, eventToRemove);
      
      // Refresh the events list
      const seriesEvents = await getEventsBySeries(seriesId);
      setEvents(seriesEvents);
      
      // Update available events
      const allEvents = await getAllEvents();
      const seriesEventIds = seriesEvents.map((e: any) => e.id);
      const filteredEvents = allEvents.filter((e: any) => !seriesEventIds.includes(e.id));
      setAvailableEvents(filteredEvents);
      
      // Reset and close dialog
      setEventToRemove(null);
      setRemoveDialogOpen(false);
    } catch (err) {
      console.error('Error removing event from series:', err);
      setError('Failed to remove event from series. Please try again later.');
    }
  };

  const formatEventFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
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
          <Typography color="text.primary">Events</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {series?.name} - Events
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/series')}
            sx={{ mr: 2 }}
          >
            Back to Series
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push(`/admin/series/${seriesId}/events/new`)}
            sx={{ mr: 2 }}
          >
            Create New Event
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => {
              setEventOrder(events.length + 1);
              setAddDialogOpen(true);
            }}
            disabled={availableEvents.length === 0}
          >
            Add Existing Event
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {events.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            No events have been added to this series yet.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => router.push(`/admin/series/${seriesId}/events/new`)}
            >
              Create New Event
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => setAddDialogOpen(true)}
              disabled={availableEvents.length === 0}
            >
              Add Existing Event
            </Button>
          </Box>
          {availableEvents.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You need to create events before you can add them to this series.
            </Typography>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Points Multiplier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.event_order}</TableCell>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>
                    {format(new Date(event.event_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {event.courses?.name || 'Unknown Course'}
                  </TableCell>
                  <TableCell>
                    {formatEventFormat(event.event_format)}
                  </TableCell>
                  <TableCell>{event.points_multiplier}x</TableCell>
                  <TableCell>
                    <Chip
                      label={event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                      color={
                        event.status === 'upcoming' ? 'info' :
                        event.status === 'in_progress' ? 'warning' :
                        event.status === 'completed' ? 'success' :
                        'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                      size="small"
                      title="Edit Event"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setEventToRemove(event.id);
                        setRemoveDialogOpen(true);
                      }}
                      size="small"
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
      )}

      {/* Add Event Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Event to Series</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Event</InputLabel>
              <Select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                label="Event"
              >
                {availableEvents.map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    {event.name} ({format(new Date(event.event_date), 'MMM d, yyyy')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Event Order"
              type="number"
              fullWidth
              value={eventOrder}
              onChange={(e) => setEventOrder(parseInt(e.target.value) || 1)}
              sx={{ mb: 2 }}
              helperText="The order in which this event appears in the series"
              inputProps={{ min: 1 }}
            />
            
            <TextField
              label="Points Multiplier"
              type="number"
              fullWidth
              value={pointsMultiplier}
              onChange={(e) => setPointsMultiplier(parseFloat(e.target.value) || 1)}
              helperText="Multiplier for points earned in this event (e.g., 2x for a major)"
              inputProps={{ min: 0.5, step: 0.5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddEvent} 
            color="primary" 
            disabled={!selectedEvent}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Event Dialog */}
      <Dialog open={removeDialogOpen} onClose={() => setRemoveDialogOpen(false)}>
        <DialogTitle>Remove Event from Series</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this event from the series? This will not delete the event itself, only its association with this series.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveEvent} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 