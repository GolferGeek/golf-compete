'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { RoundWithDetails } from '@/types/round';

interface RecentRoundsProps {
  rounds: RoundWithDetails[];
  loading?: boolean;
  error?: string | null;
  limit?: number;
  showViewAll?: boolean;
}

export default function RecentRounds({ 
  rounds, 
  loading = false, 
  error = null, 
  limit = 4,
  showViewAll = true 
}: RecentRoundsProps) {
  const displayRounds = rounds.slice(0, limit);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (rounds.length === 0) {
    return (
      <Alert severity="info">
        You haven&apos;t played any rounds yet. Click &quot;Play Round&quot; to get started!
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {displayRounds.map((round) => (
          <Grid item xs={12} sm={6} key={round.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {round.course.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(round.date_played), 'MMMM d, yyyy')}
                    </Typography>
                  </Box>
                  <Chip 
                    label={round.total_score} 
                    color="primary" 
                    size="medium"
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Grid container spacing={2}>
                  {round.total_putts > 0 && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Putts
                      </Typography>
                      <Typography variant="body1">
                        {round.total_putts}
                      </Typography>
                    </Grid>
                  )}
                  {round.fairways_hit > 0 && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Fairways
                      </Typography>
                      <Typography variant="body1">
                        {round.fairways_hit}
                      </Typography>
                    </Grid>
                  )}
                  {round.greens_in_regulation > 0 && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        GIR
                      </Typography>
                      <Typography variant="body1">
                        {round.greens_in_regulation}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    href={`/rounds/${round.id}`}
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {showViewAll && rounds.length > limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            component={Link}
            href="/rounds"
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
          >
            View All Rounds
          </Button>
        </Box>
      )}
    </Box>
  );
} 