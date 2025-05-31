"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Container,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface SimplifiedRound {
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

export default function RoundDetailPage({ params }: PageProps) {
  const { id: roundId } = use(params);
  const { user } = useAuth();
  const [round, setRound] = useState<SimplifiedRound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setRound(data as SimplifiedRound);
      } catch (error) {
        console.error('Error loading round:', error);
        setError('Failed to load round details');
      } finally {
        setLoading(false);
      }
    };

    loadRound();
  }, [roundId, user]);

  const calculateHandicapDifferential = () => {
    if (!round?.course_tees?.men_rating || !round?.course_tees?.men_slope || !round?.total_score) {
      return null;
    }

    const score = round.total_score;
    const rating = round.course_tees.men_rating;
    const slope = round.course_tees.men_slope;

    // Formula: (Score - Course Rating) × 113 / Slope Rating
    const differential = ((score - rating) * 113) / slope;
    return differential.toFixed(1);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !round) {
    return (
      <Container maxWidth="md">
        <Box sx={{ p: 2 }}>
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
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {round.courses.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {format(new Date(round.round_date), 'MMMM d, yyyy')}
              </Typography>
              {round.courses.city && round.courses.state && (
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                  {round.courses.city}, {round.courses.state}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              {isCompleted ? (
                <>
                  <Typography variant="h6">Total Score</Typography>
                  <Typography variant="h4" color="primary">
                    {round.total_score}
                  </Typography>
                  {handicapDifferential && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="h6">Differential</Typography>
                      <Typography variant="h4" color="secondary">
                        {handicapDifferential}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Chip
                  label="In Progress"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {!isCompleted && (
              <Button
                component={Link}
                href={`/rounds/${roundId}/play`}
                variant="contained"
                startIcon={<PlayArrowIcon />}
              >
                Continue Round
              </Button>
            )}
            <Button
              component={Link}
              href="/rounds"
              variant="outlined"
            >
              Back to Rounds
            </Button>
          </Box>
        </Paper>

        {/* Round Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Round Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Chip
                label={`Tee: ${round.course_tees.name}`}
                variant="outlined"
              />
              {round.course_tees.men_rating && (
                <Chip
                  label={`Rating: ${round.course_tees.men_rating}`}
                  variant="outlined"
                />
              )}
              {round.course_tees.men_slope && (
                <Chip
                  label={`Slope: ${round.course_tees.men_slope}`}
                  variant="outlined"
                />
              )}
              {round.bags && (
                <Chip
                  label={`Bag: ${round.bags.name}${round.bags.handicap ? ` (${round.bags.handicap})` : ''}`}
                  variant="outlined"
                />
              )}
            </Box>

            {/* Conditions */}
            {(round.weather_conditions || round.course_conditions || round.temperature || round.wind_conditions) && (
              <>
                <Typography variant="h6" gutterBottom>
                  Conditions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {round.weather_conditions && (
                    <Chip label={round.weather_conditions} />
                  )}
                  {round.course_conditions && (
                    <Chip label={round.course_conditions} />
                  )}
                  {round.temperature && (
                    <Chip label={`${round.temperature}°F`} />
                  )}
                  {round.wind_conditions && (
                    <Chip label={round.wind_conditions} />
                  )}
                </Box>
              </>
            )}

            {/* Notes */}
            {round.notes && (
              <>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {round.notes}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>

        {/* Round Statistics */}
        {isCompleted && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Round Statistics
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Score
                  </Typography>
                  <Typography variant="h6">
                    {round.total_score}
                  </Typography>
                </Box>
                
                {round.course_tees.men_rating && round.total_score && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      vs Par (Est.)
                    </Typography>
                    <Typography variant="h6">
                      {round.total_score - 72 > 0 ? '+' : ''}{round.total_score - 72}
                    </Typography>
                  </Box>
                )}
                
                {handicapDifferential && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Handicap Differential
                    </Typography>
                    <Typography variant="h6">
                      {handicapDifferential}
                    </Typography>
                  </Box>
                )}
                
                {round.bags?.handicap && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Expected Score
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(72 + round.bags.handicap)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
} 