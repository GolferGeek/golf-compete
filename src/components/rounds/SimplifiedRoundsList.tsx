'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { format } from 'date-fns';

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

interface SimplifiedRoundsListProps {
  rounds: SimplifiedRound[];
  loading: boolean;
  error: string | null;
}

const calculateHandicapDifferential = (
  score: number,
  rating?: number,
  slope?: number
): string | null => {
  if (!rating || !slope) return null;
  const differential = ((score - rating) * 113) / slope;
  return differential.toFixed(1);
};

export default function SimplifiedRoundsList({
  rounds,
  loading,
  error,
}: SimplifiedRoundsListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (rounds.length === 0) {
    return (
      <Card sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No rounds found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start your first round to begin tracking your golf!
        </Typography>
        <Button
          component={Link}
          href="/rounds/new"
          variant="contained"
        >
          Start Your First Round
        </Button>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rounds.map((round) => {
        const isCompleted = round.total_score !== null;
        const handicapDiff = round.total_score && round.course_tees?.men_rating && round.course_tees?.men_slope
          ? calculateHandicapDifferential(
              round.total_score,
              round.course_tees.men_rating,
              round.course_tees.men_slope
            )
          : null;

        return (
          <Card key={round.id} sx={{ transition: 'all 0.2s', '&:hover': { elevation: 4 } }}>
            <CardActionArea
              component={Link}
              href={isCompleted ? `/rounds/${round.id}` : `/rounds/${round.id}/play`}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h3">
                      {round.courses.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(round.round_date), 'MMMM d, yyyy')}
                    </Typography>
                    {round.courses.city && round.courses.state && (
                      <Typography variant="body2" color="text.secondary">
                        {round.courses.city}, {round.courses.state}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    {isCompleted ? (
                      <>
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                          {round.total_score}
                        </Typography>
                        {handicapDiff && (
                          <Typography variant="body2" color="text.secondary">
                            Diff: {handicapDiff}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Chip
                        label="In Progress"
                        color="warning"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    label={round.course_tees.name}
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
                  {round.bags && (
                    <Chip
                      label={`Bag: ${round.bags.name}`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>

                {/* Conditions */}
                {(round.weather_conditions || round.temperature) && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {round.weather_conditions && (
                      <Chip
                        label={round.weather_conditions}
                        size="small"
                        sx={{ bgcolor: 'info.100' }}
                      />
                    )}
                    {round.temperature && (
                      <Chip
                        label={`${round.temperature}°F`}
                        size="small"
                        sx={{ bgcolor: 'info.100' }}
                      />
                    )}
                  </Box>
                )}

                {/* Notes preview */}
                {round.notes && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {round.notes}
                  </Typography>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
} 