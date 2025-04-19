"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  FormControlLabel,
  Switch,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { getRoundWithDetails } from '@/api/competition/roundService';
import { createHoleScore, updateRound } from '@/api/competition/roundService';
import { RoundWithDetails, CreateHoleScoreInput } from '@/types/round';

interface ScoreEntryFormProps {
  roundId: string;
}

interface HoleScoreInput {
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  greenInRegulation: boolean;
  penaltyStrokes: number;
  notes: string;
}

const initialHoleScore: HoleScoreInput = {
  strokes: 0,
  putts: 0,
  fairwayHit: null,
  greenInRegulation: false,
  penaltyStrokes: 0,
  notes: '',
};

export default function ScoreEntryForm({ roundId }: ScoreEntryFormProps) {
  const router = useRouter();
  const [round, setRound] = useState<RoundWithDetails | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [holeScores, setHoleScores] = useState<Record<number, HoleScoreInput>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScorecard, setShowScorecard] = useState(false);

  useEffect(() => {
    const loadRound = async () => {
      try {
        const roundData = await getRoundWithDetails(roundId);
        setRound(roundData);
        
        // Initialize hole scores from existing data
        const scores: Record<number, HoleScoreInput> = {};
        roundData.hole_scores.forEach((score) => {
          scores[score.hole_number] = {
            strokes: score.strokes,
            putts: score.putts,
            fairwayHit: score.fairway_hit,
            greenInRegulation: score.green_in_regulation,
            penaltyStrokes: score.penalty_strokes,
            notes: score.notes || '',
          };
        });
        setHoleScores(scores);
        setLoading(false);
      } catch (error) {
        console.error('Error loading round:', error);
        setError('Failed to load round details');
        setLoading(false);
      }
    };

    loadRound();
  }, [roundId]);

  const handleScoreChange = (field: keyof HoleScoreInput, value: any) => {
    setHoleScores((prev) => ({
      ...prev,
      [currentHole]: {
        ...(prev[currentHole] || initialHoleScore),
        [field]: value,
      },
    }));
  };

  const handleSaveHole = async () => {
    if (!round) return;

    setSaving(true);
    setError(null);

    try {
      const currentScore = holeScores[currentHole] || initialHoleScore;
      
      // Validate score
      if (currentScore.strokes < 1) {
        setError('Please enter a valid number of strokes');
        setSaving(false);
        return;
      }

      if (currentScore.putts > currentScore.strokes) {
        setError('Number of putts cannot exceed total strokes');
        setSaving(false);
        return;
      }

      // Create hole score
      const scoreInput: CreateHoleScoreInput = {
        round_id: roundId,
        hole_number: currentHole,
        strokes: currentScore.strokes,
        putts: currentScore.putts,
        fairway_hit: currentScore.fairwayHit === null ? undefined : currentScore.fairwayHit,
        green_in_regulation: currentScore.greenInRegulation,
        penalty_strokes: currentScore.penaltyStrokes,
        notes: currentScore.notes || undefined,
      };

      await createHoleScore(scoreInput);

      // Calculate round totals
      const totalScore = Object.values(holeScores).reduce((sum, score) => sum + score.strokes, 0);
      const totalPutts = Object.values(holeScores).reduce((sum, score) => sum + score.putts, 0);
      const fairwaysHit = Object.values(holeScores).filter(score => score.fairwayHit === true).length;
      const greensInRegulation = Object.values(holeScores).filter(score => score.greenInRegulation).length;

      // Update round totals
      await updateRound({
        id: roundId,
        total_score: totalScore,
        total_putts: totalPutts,
        fairways_hit: fairwaysHit,
        greens_in_regulation: greensInRegulation,
      });

      // Move to next hole or finish
      if (currentHole < 18) {
        setCurrentHole(currentHole + 1);
      } else {
        // Redirect to round summary
        router.push(`/rounds/${roundId}`);
      }

      setSaving(false);
    } catch (error) {
      console.error('Error saving hole score:', error);
      setError('Failed to save hole score');
      setSaving(false);
    }
  };

  if (loading || !round) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {round.course.name} - Hole {currentHole}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showScorecard}
                onChange={(e) => setShowScorecard(e.target.checked)}
              />
            }
            label="Show Scorecard"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {showScorecard && (
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hole</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Putts</TableCell>
                  <TableCell align="right">FIR</TableCell>
                  <TableCell align="right">GIR</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 18 }, (_, i) => i + 1).map((hole) => {
                  const score = holeScores[hole];
                  return (
                    <TableRow 
                      key={hole}
                      sx={{ 
                        backgroundColor: hole === currentHole ? 'action.hover' : 'inherit',
                        cursor: 'pointer'
                      }}
                      onClick={() => setCurrentHole(hole)}
                    >
                      <TableCell>{hole}</TableCell>
                      <TableCell align="right">{score?.strokes || '-'}</TableCell>
                      <TableCell align="right">{score?.putts || '-'}</TableCell>
                      <TableCell align="right">
                        {score?.fairwayHit === null ? '-' : score?.fairwayHit ? '✓' : '✗'}
                      </TableCell>
                      <TableCell align="right">
                        {score?.greenInRegulation ? '✓' : '✗'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Strokes"
              type="number"
              value={holeScores[currentHole]?.strokes || ''}
              onChange={(e) => handleScoreChange('strokes', parseInt(e.target.value) || 0)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Putts"
              type="number"
              value={holeScores[currentHole]?.putts || ''}
              onChange={(e) => handleScoreChange('putts', parseInt(e.target.value) || 0)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Penalty Strokes"
              type="number"
              value={holeScores[currentHole]?.penaltyStrokes || ''}
              onChange={(e) => handleScoreChange('penaltyStrokes', parseInt(e.target.value) || 0)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {currentHole > 1 && (
                <Button
                  variant="outlined"
                  startIcon={<NavigateBeforeIcon />}
                  onClick={() => setCurrentHole(currentHole - 1)}
                >
                  Previous Hole
                </Button>
              )}
              <Button
                variant="contained"
                endIcon={currentHole < 18 ? <NavigateNextIcon /> : undefined}
                onClick={handleSaveHole}
                disabled={saving}
              >
                {saving ? (
                  <CircularProgress size={24} />
                ) : currentHole === 18 ? (
                  'Finish Round'
                ) : (
                  'Next Hole'
                )}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {currentHole > 3 && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={holeScores[currentHole]?.fairwayHit || false}
                      onChange={(e) => handleScoreChange('fairwayHit', e.target.checked)}
                    />
                  }
                  label="Fairway Hit"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={holeScores[currentHole]?.greenInRegulation || false}
                    onChange={(e) => handleScoreChange('greenInRegulation', e.target.checked)}
                  />
                }
                label="Green in Regulation"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={holeScores[currentHole]?.notes || ''}
              onChange={(e) => handleScoreChange('notes', e.target.value)}
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 