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
        <Breadcrumbs sx={{ flexGrow: 1 }}>
          <Link href="/admin/events" passHref>
            <MuiLink component="span">Events</MuiLink>
          </Link>
          <Typography color="text.primary">{event.name}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Title and Actions Section */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'flex-start' },
          gap: 2
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {event.name}
            </Typography>
            {event.description && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {event.description}
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                color={getStatusColor(event.status)}
              />
              <Chip
                label={formatEventFormat(event.event_format)}
                variant="outlined"
              />
              <Chip
                label={`${event.scoring_type.toUpperCase()} Scoring`}
                variant="outlined"
              />
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            width: { xs: '100%', md: 'auto' }
          }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/events/${eventId}/edit`)}
              fullWidth={false}
              sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
            >
              Edit Event
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PeopleIcon />}
              onClick={() => router.push(`/events/${eventId}/participants`)}
              fullWidth={false}
              sx={{ flex: { xs: 1, sm: '0 0 auto' } }}
            >
              Manage Participants
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Content Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                pb: 2,
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <Typography variant="h6" sx={{ flex: 1 }}>Event Details</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(event.event_date), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Course
                  </Typography>
                  <Typography variant="body1">
                    {event.courses?.name || 'Unknown Course'}
                  </Typography>
                  {event.courses?.location && (
                    <Typography variant="body2" color="text.secondary">
                      {event.courses.location}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Registration Closes
                  </Typography>
                  <Typography variant="body1">
                    {event.registration_close_date
                      ? format(new Date(event.registration_close_date), 'MMMM d, yyyy')
                      : 'Not specified'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Maximum Participants
                  </Typography>
                  <Typography variant="body1">
                    {event.max_participants || 'No limit'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                pb: 2,
                borderBottom: 1,
                borderColor: 'divider'
              }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  Participants ({participants.length})
                </Typography>
                <PeopleIcon color="primary" />
              </Box>
              
              {participants.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2,
                  py: 4
                }}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    No participants have been registered for this event yet.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PeopleIcon />}
                    onClick={() => router.push(`/events/${eventId}/participants`)}
                  >
                    Add Participants
                  </Button>
                </Box>
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
                        <TableRow key={participant.id} hover>
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
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {participant.handicap || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {participants.length > 5 && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      mt: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                      pt: 2
                    }}>
                      <Button
                        color="primary"
                        onClick={() => router.push(`/events/${eventId}/participants`)}
                        size="small"
                      >
                        View All Participants
                      </Button>
                    </Box>
                  )}
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 