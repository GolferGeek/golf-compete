'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { format } from 'date-fns';
import { getEventById } from '@/lib/events';
import { getEventRounds } from '@/api/competition/roundService';
import { Event } from '@/types/events';
import { EventRoundSummary } from '@/types/round';
import Link from 'next/link';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import { EventAuthGuard } from '@/components/auth/EventAuthGuard';

interface EventDayPageProps {
  params: {
    eventId: string;
  };
}

export default function EventDayPage({ params }: EventDayPageProps) {
  const router = useRouter();
  const { eventId } = params;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [rounds, setRounds] = useState<EventRoundSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Load event details and rounds
        const [eventData, roundsData] = await Promise.all([
          getEventById(eventId),
          getEventRounds(eventId)
        ]);
        
        setEvent(eventData);
        setRounds(roundsData);
      } catch (err) {
        console.error('Error loading event data:', err);
        setError('Failed to load event data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [eventId]);

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

  const content = (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : !event ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Event not found</Alert>
        </Box>
      ) : (
        <>
          {/* Event Header */}
          <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {event.name}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        {event.courses?.name}
                      </Typography>
                      {event.courses?.city && event.courses?.state && (
                        <Typography variant="body2" color="text.secondary">
                          {event.courses.city}, {event.courses.state}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Format
                      </Typography>
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {event.event_format.replace('_', ' ')}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Status
                      </Typography>
                      <Chip
                        label={event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                        color={getStatusColor(event.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {event.description && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="body1">
                    {event.description}
                  </Typography>
                </>
              )}
            </Box>
          </Paper>

          {/* Rounds Section */}
          <Paper elevation={2}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5" component="h2">
                  Rounds
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayCircleOutlineIcon />}
                  component={Link}
                  href={`/rounds/new?eventId=${eventId}`}
                >
                  Start Round
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {rounds?.rounds.length === 0 ? (
                <Alert severity="info">
                  No rounds have been played yet. Be the first to start a round!
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell align="right">Putts</TableCell>
                        <TableCell align="right">FIR</TableCell>
                        <TableCell align="right">GIR</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rounds?.rounds.map((round) => (
                        <TableRow key={round.round_id}>
                          <TableCell>{round.user_name}</TableCell>
                          <TableCell align="right">{round.total_score}</TableCell>
                          <TableCell align="right">{round.total_putts}</TableCell>
                          <TableCell align="right">{round.fairways_hit}</TableCell>
                          <TableCell align="right">{round.greens_in_regulation}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              startIcon={<ScoreboardIcon />}
                              component={Link}
                              href={`/rounds/${round.round_id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );

  return (
    <EventAuthGuard eventId={eventId}>
      {content}
    </EventAuthGuard>
  );
} 