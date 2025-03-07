"use client";

import React, { useState, useEffect, use } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getRoundWithDetails } from '@/services/roundService';
import { RoundWithDetails } from '@/types/round';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RoundSummaryPage({ params }: PageProps) {
  const { id } = use(params);
  const [round, setRound] = useState<RoundWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRound = async () => {
      try {
        const roundData = await getRoundWithDetails(id);
        setRound(roundData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading round:', error);
        setError('Failed to load round details');
        setLoading(false);
      }
    };

    loadRound();
  }, [id]);

  const calculateStats = () => {
    if (!round) return null;

    const totalPutts = round.hole_scores.reduce((sum, score) => sum + (score.putts || 0), 0);
    const fairwaysHit = round.hole_scores.filter(score => score.fairway_hit).length;
    const totalFairways = round.hole_scores.filter(score => score.hole_number > 3).length; // Exclude par 3s
    const greensInRegulation = round.hole_scores.filter(score => score.green_in_regulation).length;
    const totalPenalties = round.hole_scores.reduce((sum, score) => sum + (score.penalty_strokes || 0), 0);

    // Only include stats that have data
    const stats: Record<string, any> = {};

    const hasPutts = round.hole_scores.some(score => score.putts > 0);
    const hasFairways = round.hole_scores.some(score => score.fairway_hit !== null);
    const hasGIR = round.hole_scores.some(score => score.green_in_regulation);
    const hasPenalties = round.hole_scores.some(score => score.penalty_strokes > 0);

    if (hasPutts) {
      stats.putting = {
        total: totalPutts,
        average: (totalPutts / 18).toFixed(1)
      };
    }

    if (hasFairways) {
      stats.fairways = {
        hit: fairwaysHit,
        percentage: ((fairwaysHit / totalFairways) * 100).toFixed(1)
      };
    }

    if (hasGIR && greensInRegulation > 0) {
      stats.greens = {
        hit: greensInRegulation,
        percentage: ((greensInRegulation / 18) * 100).toFixed(1)
      };
    }

    if (hasPenalties) {
      stats.penalties = {
        total: totalPenalties
      };
    }

    return {
      stats: Object.keys(stats).length > 0 ? stats : null,
      showPutts: hasPutts,
      showFairways: hasFairways,
      showGIR: hasGIR && greensInRegulation > 0,
      showPenalties: hasPenalties
    };
  };

  const calculateHandicapDifferential = () => {
    if (!round?.tee_set?.rating || !round?.tee_set?.slope) return null;

    const score = round.total_score;
    const rating = round.tee_set.rating;
    const slope = round.tee_set.slope;

    // Formula: (Score - Course Rating) × 113 / Slope Rating
    const differential = ((score - rating) * 113) / slope;
    return differential.toFixed(1);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !round) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error || 'Round not found'}</Alert>
      </Box>
    );
  }

  const stats = calculateStats();
  const handicapDifferential = calculateHandicapDifferential();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {round.course.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {format(new Date(round.date_played), 'MMMM d, yyyy')}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Bag: {round.bag.name} {round.bag.handicap && `(Handicap: ${round.bag.handicap})`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
              <Box>
                <Typography variant="h6">Total Score</Typography>
                <Typography variant="h4" color="primary">
                  {round.total_score}
                </Typography>
              </Box>
              {handicapDifferential && (
                <Box>
                  <Typography variant="h6">Differential</Typography>
                  <Typography variant="h4" color="secondary">
                    {handicapDifferential}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      {stats?.stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.stats.putting && (
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Putting</Typography>
                  <Typography variant="h4">{stats.stats.putting.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.stats.putting.average} putts per hole
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {stats.stats.fairways && (
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Fairways</Typography>
                  <Typography variant="h4">{stats.stats.fairways.hit}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.stats.fairways.percentage}% hit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {stats.stats.greens && (
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>GIR</Typography>
                  <Typography variant="h4">{stats.stats.greens.hit}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.stats.greens.percentage}% hit
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          {stats.stats.penalties && (
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Penalties</Typography>
                  <Typography variant="h4">{stats.stats.penalties.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total penalty strokes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Hole-by-Hole Breakdown */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hole-by-Hole Breakdown
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hole</TableCell>
                <TableCell align="right">Par</TableCell>
                <TableCell align="right">Score</TableCell>
                {stats?.showPutts && <TableCell align="right">Putts</TableCell>}
                {stats?.showFairways && <TableCell align="right">FIR</TableCell>}
                {stats?.showGIR && <TableCell align="right">GIR</TableCell>}
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {round.hole_scores
                .sort((a, b) => a.hole_number - b.hole_number)
                .map((score) => (
                  <TableRow key={score.hole_number}>
                    <TableCell>{score.hole_number}</TableCell>
                    <TableCell align="right">4</TableCell>
                    <TableCell 
                      align="right"
                      sx={{
                        color: score.strokes === 4 ? 'text.primary' :
                               score.strokes < 4 ? 'success.main' : 'error.main'
                      }}
                    >
                      {score.strokes}
                    </TableCell>
                    {stats?.showPutts && <TableCell align="right">{score.putts}</TableCell>}
                    {stats?.showFairways && (
                      <TableCell align="right">
                        {score.hole_number <= 3 ? '-' : 
                          (score.fairway_hit ? '✓' : '✗')}
                      </TableCell>
                    )}
                    {stats?.showGIR && (
                      <TableCell align="right">
                        {score.green_in_regulation ? '✓' : '✗'}
                      </TableCell>
                    )}
                    <TableCell>{score.notes || '-'}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
} 