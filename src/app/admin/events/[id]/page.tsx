"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';
import { getEventById } from '@/lib/events';
import { getEventParticipants } from '@/lib/participants';

interface EventDetailPageProps {
  params: {
    id: string;
  };
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any) as { id: string };
  const eventId = unwrappedParams.id;
  
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load event details
        const eventData = await getEventById(eventId);
        setEvent(eventData);
        
        // Load participants
        const participantsData = await getEventParticipants(eventId);
        setParticipants(participantsData);
      } catch (err) {
        console.error('Error loading event data:', err);
        setError('Failed to load event data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [eventId]);

  const formatEventFormat = (format: string) => {
    return format.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          variant="outlined"
        >
          Back
        </Button>
        <Breadcrumbs>
          <Link href="/admin/events" passHref>
            <MuiLink component="span">Events</MuiLink>
          </Link>
          <Typography color="text.primary">{event.name}</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {event.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {event.description}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
              color={getStatusColor(event.status)}
              sx={{ mr: 1 }}
            />
            <Chip
              label={formatEventFormat(event.event_format)}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`${event.scoring_type.toUpperCase()} Scoring`}
              variant="outlined"
            />
          </Box>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/admin/events/${eventId}/edit`)}
            sx={{ mr: 2 }}
          >
            Edit Event
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PeopleIcon />}
            onClick={() => router.push(`/admin/events/${eventId}/participants`)}
          >
            Manage Participants
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Event Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography>{format(new Date(event.event_date), 'MMMM d, yyyy')}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Course</Typography>
                  <Typography>{event.courses?.name || 'Unknown Course'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.courses?.location}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Registration Closes</Typography>
                  <Typography>
                    {event.registration_close_date
                      ? format(new Date(event.registration_close_date), 'MMMM d, yyyy')
                      : 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Maximum Participants</Typography>
                  <Typography>{event.max_participants || 'No limit'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Participants ({participants.length})
                </Typography>
                <PeopleIcon color="primary" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {participants.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No participants have been registered for this event yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Handicap</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.slice(0, 5).map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            {participant.first_name} {participant.last_name}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                              size="small"
                              color={
                                participant.status === 'confirmed' ? 'success' :
                                participant.status === 'registered' ? 'info' :
                                participant.status === 'withdrawn' ? 'error' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {participant.handicap_index || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {participants.length > 5 && (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        And {participants.length - 5} more participants...
                      </Typography>
                    </Box>
                  )}
                </TableContainer>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => router.push(`/admin/events/${eventId}/participants`)}
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