"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { getRoundWithDetails, createHoleScore, updateRound } from '@/api/competition/roundService';
import { RoundWithDetails, CreateHoleScoreInput } from '@/types/round';
import { useRouter } from 'next/navigation';
import DoneIcon from '@mui/icons-material/Done';

interface QuickScoreCardProps {
  roundId: string;
}

interface QuickScore {
  strokes: number;
}

interface DetailedScore {
  strokes: number;
  putts: number;
  fairwayHit: boolean | null;
  greenInRegulation: boolean;
  penaltyStrokes: number;
  notes: string;
}

export default function QuickScoreCard({ roundId }: QuickScoreCardProps) {
  const router = useRouter();
  const [round, setRound] = useState<RoundWithDetails | null>(null);
  const [scores, setScores] = useState<Record<number, QuickScore>>({});
  const [detailedScores, setDetailedScores] = useState<Record<number, DetailedScore>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const loadRound = async () => {
      try {
        const roundData = await getRoundWithDetails(roundId);
        setRound(roundData);
        
        // Initialize scores from existing data
        const quickScores: Record<number, QuickScore> = {};
        const detailed: Record<number, DetailedScore> = {};
        let total = 0;

        roundData.hole_scores.forEach((score) => {
          quickScores[score.hole_number] = { strokes: score.strokes };
          detailed[score.hole_number] = {
            strokes: score.strokes,
            putts: score.putts,
            fairwayHit: score.fairway_hit,
            greenInRegulation: score.green_in_regulation,
            penaltyStrokes: score.penalty_strokes || 0,
            notes: score.notes || '',
          };
          total += score.strokes;
        });

        setScores(quickScores);
        setDetailedScores(detailed);
        setTotalScore(total);
        setLoading(false);
      } catch (error) {
        console.error('Error loading round:', error);
        setError('Failed to load round details');
        setLoading(false);
      }
    };

    loadRound();
  }, [roundId]);

  const handleQuickScoreChange = async (hole: number, strokes: number) => {
    try {
      const scoreInput: CreateHoleScoreInput = {
        round_id: roundId,
        hole_number: hole,
        strokes,
        putts: detailedScores[hole]?.putts || 0,
        fairway_hit: detailedScores[hole]?.fairwayHit === null ? undefined : detailedScores[hole]?.fairwayHit,
        green_in_regulation: detailedScores[hole]?.greenInRegulation || false,
        penalty_strokes: detailedScores[hole]?.penaltyStrokes,
        notes: detailedScores[hole]?.notes,
      };

      await createHoleScore(scoreInput);

      // Update local state
      setScores(prev => ({
        ...prev,
        [hole]: { strokes }
      }));

      // Update total score
      const newTotal = Object.values(scores).reduce((sum, score) => sum + score.strokes, 0) + strokes;
      setTotalScore(newTotal);

      // Update round totals
      await updateRound({
        id: roundId,
        total_score: newTotal,
      });
    } catch (error) {
      console.error('Error saving score:', error);
      setError('Failed to save score');
    }
  };

  const handleDetailedScoreChange = async (hole: number, field: keyof DetailedScore, value: any) => {
    setDetailedScores(prev => ({
      ...prev,
      [hole]: {
        ...(prev[hole] || {
          strokes: scores[hole]?.strokes || 0,
          putts: 0,
          fairwayHit: null,
          greenInRegulation: false,
          penaltyStrokes: 0,
          notes: '',
        }),
        [field]: value,
      },
    }));
  };

  const handleSaveDetailedScore = async () => {
    if (!selectedHole) return;

    try {
      const score = detailedScores[selectedHole];
      if (!score) return;

      const scoreInput: CreateHoleScoreInput = {
        round_id: roundId,
        hole_number: selectedHole,
        strokes: score.strokes,
        putts: score.putts,
        fairway_hit: score.fairwayHit === null ? undefined : score.fairwayHit,
        green_in_regulation: score.greenInRegulation,
        penalty_strokes: score.penaltyStrokes,
        notes: score.notes,
      };

      await createHoleScore(scoreInput);

      // Update quick scores
      setScores(prev => ({
        ...prev,
        [selectedHole]: { strokes: score.strokes }
      }));

      // Update total score
      const newTotal = Object.values(scores).reduce((sum, score) => sum + score.strokes, 0);
      setTotalScore(newTotal);

      // Update round totals
      await updateRound({
        id: roundId,
        total_score: newTotal,
      });

      setSelectedHole(null);
    } catch (error) {
      console.error('Error saving detailed score:', error);
      setError('Failed to save detailed score');
    }
  };

  const handleFinishRound = () => {
    // Check if all holes have scores
    const missingHoles = Array.from({ length: 18 }, (_, i) => i + 1)
      .filter(hole => !scores[hole]?.strokes);

    if (missingHoles.length > 0) {
      const confirm = window.confirm(
        `You haven't entered scores for holes ${missingHoles.join(', ')}. Do you want to finish anyway?`
      );
      if (!confirm) return;
    }

    router.push(`/rounds/${roundId}`);
  };

  const renderNineHoles = (start: number, end: number) => (
    <Grid container direction="column" sx={{ width: '50%' }}>
      <Grid item>
        <Typography variant="subtitle2" sx={{ mb: 1, textAlign: 'center' }}>
          {start === 1 ? 'OUT' : 'IN'}
        </Typography>
      </Grid>

      {Array.from({ length: 9 }, (_, i) => i + start).map((hole) => (
        <Grid 
          container 
          key={hole} 
          spacing={1} 
          alignItems="center"
          sx={{ 
            mb: 0.5,
            '&:nth-of-type(odd)': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <Grid item xs={2}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {hole}
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="caption" color="text.secondary">
              4
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5 
            }}>
              <TextField
                size="small"
                value={scores[hole]?.strokes || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 20)) {
                    handleQuickScoreChange(hole, parseInt(value) || 0);
                  }
                }}
                inputProps={{ 
                  style: { 
                    textAlign: 'center',
                    padding: '2px',
                    width: '2em'
                  }
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'transparent'
                    },
                    '&:hover fieldset': {
                      borderColor: 'transparent'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
              <IconButton 
                size="small" 
                onClick={() => setSelectedHole(hole)}
                sx={{ 
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main'
                  }
                }}
              >
                <EditIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      ))}

      <Grid 
        container 
        spacing={1} 
        alignItems="center" 
        sx={{ 
          mt: 1, 
          pt: 1, 
          borderTop: 1, 
          borderColor: 'divider',
          fontWeight: 'bold'
        }}
      >
        <Grid item xs={2}>
          <Typography variant="caption">
            Total
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="caption">
            36
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2">
            {Object.entries(scores)
              .filter(([hole]) => parseInt(hole) >= start && parseInt(hole) <= end)
              .reduce((sum, [_, score]) => sum + score.strokes, 0) || 0}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );

  if (loading || !round) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {round.course.name}
          </Typography>
          <Typography variant="h6">
            Total: {totalScore}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          '& > *:first-of-type': {
            borderRight: 1,
            borderColor: 'divider',
            pr: 2
          },
          '& > *:last-child': {
            pl: 2
          }
        }}>
          {renderNineHoles(1, 9)}
          {renderNineHoles(10, 18)}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          mt: 3,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleFinishRound}
            startIcon={<DoneIcon />}
          >
            Finish Round
          </Button>
        </Box>
      </Paper>

      {/* Detailed Score Dialog */}
      <Dialog 
        open={selectedHole !== null} 
        onClose={() => setSelectedHole(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Hole {selectedHole} Details</DialogTitle>
        <DialogContent>
          {selectedHole && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Strokes"
                  type="number"
                  value={detailedScores[selectedHole]?.strokes || ''}
                  onChange={(e) => handleDetailedScoreChange(selectedHole, 'strokes', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 20 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Putts"
                  type="number"
                  value={detailedScores[selectedHole]?.putts || ''}
                  onChange={(e) => handleDetailedScoreChange(selectedHole, 'putts', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 20 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Penalty Strokes"
                  type="number"
                  value={detailedScores[selectedHole]?.penaltyStrokes || ''}
                  onChange={(e) => handleDetailedScoreChange(selectedHole, 'penaltyStrokes', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 5 }}
                />
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={detailedScores[selectedHole]?.fairwayHit === true ? "contained" : "outlined"}
                  onClick={() => handleDetailedScoreChange(selectedHole, 'fairwayHit', true)}
                  sx={{ mr: 1 }}
                >
                  Fairway Hit
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={detailedScores[selectedHole]?.greenInRegulation ? "contained" : "outlined"}
                  onClick={() => handleDetailedScoreChange(selectedHole, 'greenInRegulation', !detailedScores[selectedHole]?.greenInRegulation)}
                >
                  GIR
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={detailedScores[selectedHole]?.notes || ''}
                  onChange={(e) => handleDetailedScoreChange(selectedHole, 'notes', e.target.value)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedHole(null)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveDetailedScore}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 