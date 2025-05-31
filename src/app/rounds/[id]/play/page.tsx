'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import QuickNoteButton from '@/components/notes/QuickNoteButton';
import { updateHandicapsAfterRound } from '@/lib/handicapService';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface RoundDetails {
  id: string;
  user_id: string;
  course_id: string;
  course_tee_id: string;
  bag_id?: string;
  round_date: string;
  total_score?: number;
  weather_conditions?: string;
  course_conditions?: string;
  temperature?: number;
  wind_conditions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  courses: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  course_tees: {
    id: string;
    name: string;
    men_rating?: number;
    men_slope?: number;
  };
  bags?: {
    id: string;
    name: string;
    handicap?: number;
  };
}

export default function ActiveRoundPage({ params }: PageProps) {
  const { id: roundId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [round, setRound] = useState<RoundDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Score entry
  const [totalScore, setTotalScore] = useState<number | ''>('');
  const [postRoundNotes, setPostRoundNotes] = useState('');

  useEffect(() => {
    const loadRound = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error: roundError } = await supabase
          .from('rounds')
          .select(`
            *,
            courses (id, name, city, state),
            course_tees (id, name, men_rating, men_slope),
            bags (id, name, handicap)
          `)
          .eq('id', roundId)
          .eq('user_id', user.id)
          .single();

        if (roundError) throw roundError;
        
        setRound(data as RoundDetails);
        setTotalScore(data.total_score || '');
        setPostRoundNotes(data.notes || '');
        
      } catch (error) {
        console.error('Error loading round:', error);
        setError('Failed to load round details');
      } finally {
        setLoading(false);
      }
    };

    loadRound();
  }, [roundId, user]);

  const handleEndRound = async () => {
    if (!round || !user || !totalScore) {
      setError('Please enter a total score');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: updateError } = await supabase
        .from('rounds')
        .update({
          total_score: Number(totalScore),
          notes: postRoundNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roundId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update handicap for the specific bag used in this round
      if (round.bag_id) {
        try {
          await updateHandicapsAfterRound(user.id, roundId, round.bag_id);
        } catch (handicapError) {
          console.error('Error updating handicap:', handicapError);
          // Don't fail the round completion if handicap update fails
        }
      }

      // Navigate to the completed round view
      router.push(`/rounds/${roundId}`);
    } catch (error) {
      console.error('Error ending round:', error);
      setError('Failed to save round. Please try again.');
      setSubmitting(false);
    }
  };

  const calculateHandicapDifferential = () => {
    if (!round?.course_tees?.men_rating || !round?.course_tees?.men_slope || !totalScore) {
      return null;
    }

    const score = Number(totalScore);
    const rating = round.course_tees.men_rating;
    const slope = round.course_tees.men_slope;

    // Formula: (Score - Course Rating) × 113 / Slope Rating
    const differential = ((score - rating) * 113) / slope;
    return differential.toFixed(1);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !round) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error || 'Round not found'}</Alert>
        </Box>
      </Container>
    );
  }

  const handicapDifferential = calculateHandicapDifferential();
  const isCompleted = round.total_score !== null;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isCompleted ? 'Round Complete' : 'Active Round'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Round Details Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {round.courses.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {format(new Date(round.round_date), 'MMMM d, yyyy')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 2 }}>
              <Chip 
                label={`Tee: ${round.course_tees.name}`} 
                variant="outlined" 
                size="small" 
              />
              {round.course_tees.men_rating && (
                <Chip 
                  label={`Rating: ${round.course_tees.men_rating}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
              {round.course_tees.men_slope && (
                <Chip 
                  label={`Slope: ${round.course_tees.men_slope}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
              {round.bags && (
                <Chip 
                  label={`Bag: ${round.bags.name}`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Box>

            {/* Conditions */}
            {(round.weather_conditions || round.course_conditions || round.temperature || round.wind_conditions) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Conditions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {round.weather_conditions && (
                    <Chip label={round.weather_conditions} size="small" />
                  )}
                  {round.course_conditions && (
                    <Chip label={round.course_conditions} size="small" />
                  )}
                  {round.temperature && (
                    <Chip label={`${round.temperature}°F`} size="small" />
                  )}
                  {round.wind_conditions && (
                    <Chip label={round.wind_conditions} size="small" />
                  )}
                </Box>
              </Box>
            )}

            {/* Pre-round notes */}
            {round.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Pre-Round Notes:
                </Typography>
                <Typography variant="body2">
                  {round.notes}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Score Entry */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {isCompleted ? 'Final Score' : 'Enter Final Score'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
            <TextField
              label="Total Score"
              type="number"
              value={totalScore}
              onChange={(e) => setTotalScore(e.target.value ? Number(e.target.value) : '')}
              inputProps={{ min: 18, max: 200 }}
              disabled={isCompleted}
              sx={{ width: 150 }}
            />
            
            {handicapDifferential && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Handicap Differential
                </Typography>
                <Typography variant="h6" color="primary">
                  {handicapDifferential}
                </Typography>
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            label="Post-Round Notes"
            multiline
            rows={4}
            value={postRoundNotes}
            onChange={(e) => setPostRoundNotes(e.target.value)}
            placeholder="How did the round go? Any observations or thoughts..."
            disabled={isCompleted}
            sx={{ mb: 3 }}
          />

          {!isCompleted && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Save for Later
              </Button>
              <Button
                variant="contained"
                onClick={handleEndRound}
                disabled={!totalScore || submitting}
                sx={{ flex: 1 }}
              >
                {submitting ? 'Saving Round...' : 'Complete Round'}
              </Button>
            </Box>
          )}

          {isCompleted && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/rounds')}
              >
                View All Rounds
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push('/rounds/new')}
              >
                Start New Round
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Quick Note Button - only show during active rounds */}
      {!isCompleted && (
        <QuickNoteButton
          roundId={roundId}
          onNoteCreated={() => {
            // Optionally refresh data or show a toast
            console.log('Note created during round');
          }}
        />
      )}
    </Container>
  );
} 