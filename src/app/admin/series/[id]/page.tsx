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
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';
import { getSeriesById } from '@/lib/series';
import { getEventsBySeries } from '@/lib/events';
import { getSeriesParticipants } from '@/lib/participants';

interface SeriesDetailPageProps {
  params: {
    id: string;
  };
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any) as { id: string };
  const seriesId = unwrappedParams.id;
  
  const [series, setSeries] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Load participants for this series
        const participantsData = await getSeriesParticipants(seriesId);
        setParticipants(participantsData);
      } catch (err) {
        console.error('Error loading series data:', err);
        setError('Failed to load series data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [seriesId]);

  const formatSeriesType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
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
          <Typography color="text.primary">Series Details</Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {series.name}
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
            startIcon={<EditIcon />}
            onClick={() => router.push(`/admin/series/edit/${seriesId}`)}
          >
            Edit Series
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">Series Type</Typography>
            <Typography variant="body1">{formatSeriesType(series.series_type)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">Status</Typography>
            <Chip 
              label={series.status.charAt(0).toUpperCase() + series.status.slice(1).replace('_', ' ')} 
              color={getStatusColor(series.status) as any}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">Start Date</Typography>
            <Typography variant="body1">
              {series.start_date ? format(new Date(series.start_date), 'MMMM d, yyyy') : 'Not set'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="text.secondary">End Date</Typography>
            <Typography variant="body1">
              {series.end_date ? format(new Date(series.end_date), 'MMMM d, yyyy') : 'Not set'}
            </Typography>
          </Grid>
          {series.description && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="text.secondary">Description</Typography>
              <Typography variant="body1">{series.description}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Events ({events.length})
                </Typography>
                <EventIcon color="primary" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {events.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No events have been added to this series yet.
                </Typography>
              ) : (
                <Box>
                  {events.slice(0, 3).map((event) => (
                    <Box key={event.id} sx={{ mb: 1 }}>
                      <Typography variant="body1">{event.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(event.event_date), 'MMM d, yyyy')} • {event.courses?.name || 'Unknown Course'}
                      </Typography>
                    </Box>
                  ))}
                  {events.length > 3 && (
                    <Typography variant="body2" color="text.secondary">
                      And {events.length - 3} more events...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => router.push(`/admin/series/${seriesId}/events`)}
              >
                Manage Events
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Participants ({participants.length})
                </Typography>
                <PeopleIcon color="primary" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {participants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No participants have been added to this series yet.
                </Typography>
              ) : (
                <Box>
                  {participants.slice(0, 3).map((participant) => (
                    <Box key={participant.id} sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        {participant.first_name} {participant.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {participant.role === 'admin' ? 'Admin' : 'Participant'} • {participant.status}
                      </Typography>
                    </Box>
                  ))}
                  {participants.length > 3 && (
                    <Typography variant="body2" color="text.secondary">
                      And {participants.length - 3} more participants...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => router.push(`/admin/series/${seriesId}/participants`)}
              >
                Manage Participants
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 