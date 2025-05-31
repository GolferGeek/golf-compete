'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';
import { calculateAndUpdateHandicap, getCurrentHandicap } from '@/lib/handicapService';
import HandicapHistoryView from './HandicapHistoryView';

interface BagWithHandicap {
  id: string;
  name: string;
  handicap: number | null;
  rounds_count: number;
  last_round_date: string | null;
  recent_trend?: 'up' | 'down' | 'stable';
}

interface BagHandicapOverviewProps {
  userId: string;
  onBagSelect?: (bagId: string) => void;
}

export default function BagHandicapOverview({
  userId,
  onBagSelect,
}: BagHandicapOverviewProps) {
  const [bags, setBags] = useState<BagWithHandicap[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBagHistory, setSelectedBagHistory] = useState<string | null>(null);

  const loadBagsWithHandicaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Get bags with round counts and last round dates
      const { data: bagsData, error: bagsError } = await supabase
        .from('bags')
        .select(`
          id,
          name,
          handicap,
          rounds!bag_id (
            id,
            round_date,
            total_score
          )
        `)
        .eq('user_id', userId)
        .order('name');

      if (bagsError) throw bagsError;

      // Process the data to include statistics
      const processedBags: BagWithHandicap[] = (bagsData || []).map(bag => {
        const completedRounds = bag.rounds?.filter(r => r.total_score !== null) || [];
        const lastRound = completedRounds.length > 0 
          ? completedRounds.sort((a, b) => new Date(b.round_date).getTime() - new Date(a.round_date).getTime())[0]
          : null;

        return {
          id: bag.id,
          name: bag.name,
          handicap: bag.handicap,
          rounds_count: completedRounds.length,
          last_round_date: lastRound?.round_date || null,
        };
      });

      setBags(processedBags);
    } catch (err) {
      console.error('Error loading bags with handicaps:', err);
      setError('Failed to load bag handicaps');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateHandicap = async (bagId: string) => {
    try {
      setUpdating(bagId);
      await calculateAndUpdateHandicap(userId, bagId);
      await loadBagsWithHandicaps();
    } catch (err) {
      console.error('Error recalculating handicap for bag:', err);
      setError('Failed to recalculate handicap');
    } finally {
      setUpdating(null);
    }
  };

  const handleRecalculateAll = async () => {
    try {
      setUpdating('all');
      
      // Update handicaps for all bags that have rounds
      const bagsWithRounds = bags.filter(bag => bag.rounds_count >= 3);
      await Promise.all(
        bagsWithRounds.map(bag => calculateAndUpdateHandicap(userId, bag.id))
      );
      
      await loadBagsWithHandicaps();
    } catch (err) {
      console.error('Error recalculating all handicaps:', err);
      setError('Failed to recalculate handicaps');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    loadBagsWithHandicaps();
  }, [userId]);

  const formatHandicap = (handicap: number | null): string => {
    if (handicap === null) return 'N/A';
    if (handicap === 0) return 'Scratch';
    if (handicap < 0) return `+${Math.abs(handicap).toFixed(1)}`;
    return handicap.toFixed(1);
  };

  const getHandicapColor = (handicap: number | null): 'default' | 'primary' | 'secondary' | 'success' | 'warning' => {
    if (handicap === null) return 'default';
    if (handicap <= 0) return 'success';
    if (handicap <= 10) return 'primary';
    if (handicap <= 20) return 'secondary';
    return 'warning';
  };

  const canCalculateHandicap = (roundsCount: number): boolean => roundsCount >= 3;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Bag Handicaps
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={updating === 'all' ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRecalculateAll}
          disabled={updating !== null}
          size="small"
        >
          {updating === 'all' ? 'Updating All...' : 'Recalculate All'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {bags.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No bags found. Create a bag setup to start tracking bag-specific handicaps.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}>
          {bags.map((bag) => (
            <Box key={bag.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {bag.name}
                    </Typography>
                    
                    {updating === bag.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleRecalculateHandicap(bag.id)}
                        disabled={updating !== null}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h4" color={getHandicapColor(bag.handicap)}>
                      {formatHandicap(bag.handicap)}
                    </Typography>
                    
                    {bag.handicap !== null && bag.handicap <= 10 && (
                      <Chip
                        icon={<TrendingUpIcon />}
                        label="Low"
                        color="success"
                        size="small"
                      />
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Rounds played: {bag.rounds_count}
                    </Typography>
                    
                    {bag.last_round_date && (
                      <Typography variant="body2" color="text.secondary">
                        Last round: {new Date(bag.last_round_date).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  {!canCalculateHandicap(bag.rounds_count) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Need at least 3 completed rounds to calculate handicap">
                        <InfoIcon fontSize="small" color="warning" />
                      </Tooltip>
                      <Typography variant="caption" color="warning.main">
                        Need {3 - bag.rounds_count} more rounds
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={() => setSelectedBagHistory(bag.id)}
                    disabled={bag.rounds_count === 0}
                  >
                    History
                  </Button>
                  
                  {onBagSelect && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onBagSelect(bag.id)}
                    >
                      Select
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Handicap History Dialog */}
      <Dialog
        open={selectedBagHistory !== null}
        onClose={() => setSelectedBagHistory(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Handicap History - {bags.find(b => b.id === selectedBagHistory)?.name}
        </DialogTitle>
        <DialogContent>
          {selectedBagHistory && (
            <HandicapHistoryView
              userId={userId}
              bagId={selectedBagHistory}
              showBagFilter={false}
              maxRounds={50}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedBagHistory(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 