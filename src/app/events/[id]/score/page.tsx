'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import { getEventById } from '@/lib/events';
import { createRound, getEventRounds } from '@/services/roundService';
import { Event } from '@/types/events';
import { EventRoundSummary } from '@/types/round';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseClient } from '@/lib/auth';

interface EventScoringPageProps {
  params: {
    id: string;
  };
}

interface EventWithDetails extends Event {
  tee_set_id: string;
}

export default function EventScoringPage({ params }: EventScoringPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [roundSummary, setRoundSummary] = useState<EventRoundSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingRound, setStartingRound] = useState(false);

  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true);
        
        // Get event data
        const { data: eventData, error: eventError } = await supabaseClient
          .from('events')
          .select('*, courses(name, city, state), tee_sets(id)')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Event not found');
        
        // Get default tee set if not specified
        if (!eventData.tee_sets?.id) {
          const { data: teeSetData, error: teeSetError } = await supabaseClient
            .from('tee_sets')
            .select('id')
            .eq('course_id', eventData.course_id)
            .eq('is_default', true)
            .single();

          if (teeSetError) throw teeSetError;
          if (!teeSetData) throw new Error('No default tee set found');
          
          eventData.tee_set_id = teeSetData.id;
        } else {
          eventData.tee_set_id = eventData.tee_sets.id;
        }

        setEvent(eventData as EventWithDetails);

        // Load existing rounds
        const roundsData = await getEventRounds(eventId);
        setRoundSummary(roundsData);
      } catch (err) {
        console.error('Error loading event data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    }

    loadEventData();
  }, [eventId]);

  const handleStartRound = async () => {
    if (!user || !event) return;

    try {
      setStartingRound(true);
      setError(null);

      // Get default tee set if not specified
      let teeSetId = event.tee_set_id;
      if (!teeSetId) {
        const { data: teeSetData } = await supabaseClient
          .from('tee_sets')
          .select('id')
          .eq('course_id', event.course_id)
          .eq('is_default', true)
          .single();
        
        teeSetId = teeSetData?.id;
      }

      const params = {
        eventId,
        courseId: event.course_id,
        teeSetId,
        date: event.event_date
      };
      console.log('URL Parameters:', params);

      // Navigate to round creation form with pre-selected values
      const url = `/rounds/new?eventId=${eventId}&courseId=${event.course_id}&teeSetId=${teeSetId}&date=${event.event_date}`;
      console.log('Full URL:', url);
      router.push(url);
    } catch (err) {
      console.error('Error starting round:', err);
      setError('Failed to start round. Please try again.');
    } finally {
      setStartingRound(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Event not found</Alert>
      </Box>
    );
  }

  // Find the current user's round
  const userRound = roundSummary?.rounds.find(
    round => round.user_id === user?.id
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {event.name}
          </Typography>
          {!userRound && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartRound}
              disabled={startingRound}
            >
              {startingRound ? <CircularProgress size={24} /> : 'Start Round'}
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hole</TableCell>
                {roundSummary?.rounds.map((round) => (
                  <TableCell key={round.round_id} align="center">
                    {round.user_name}
                    {round.user_id === user?.id && ' (You)'}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Front Nine */}
              {Array.from({ length: 9 }, (_, i) => i + 1).map((hole) => (
                <TableRow key={hole}>
                  <TableCell>{hole}</TableCell>
                  {roundSummary?.rounds.map((round) => (
                    <TableCell key={round.round_id} align="center">
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ 
                          min: 1, 
                          style: { textAlign: 'center' },
                          disabled: round.user_id !== user?.id 
                        }}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {/* Front Nine Total */}
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                <TableCell>Out</TableCell>
                {roundSummary?.rounds.map((round) => (
                  <TableCell key={round.round_id} align="center">
                    -
                  </TableCell>
                ))}
              </TableRow>
              {/* Back Nine */}
              {Array.from({ length: 9 }, (_, i) => i + 10).map((hole) => (
                <TableRow key={hole}>
                  <TableCell>{hole}</TableCell>
                  {roundSummary?.rounds.map((round) => (
                    <TableCell key={round.round_id} align="center">
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ 
                          min: 1, 
                          style: { textAlign: 'center' },
                          disabled: round.user_id !== user?.id 
                        }}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {/* Back Nine Total */}
              <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                <TableCell>In</TableCell>
                {roundSummary?.rounds.map((round) => (
                  <TableCell key={round.round_id} align="center">
                    -
                  </TableCell>
                ))}
              </TableRow>
              {/* Total Score */}
              <TableRow sx={{ 
                backgroundColor: (theme) => theme.palette.action.hover,
                '& td': { fontWeight: 'bold' }
              }}>
                <TableCell>Total</TableCell>
                {roundSummary?.rounds.map((round) => (
                  <TableCell key={round.round_id} align="center">
                    {round.total_score || '-'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
} 