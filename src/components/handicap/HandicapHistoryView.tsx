'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { 
  getHandicapHistory, 
  calculateAndUpdateHandicap,
  type HandicapDifferential 
} from '@/lib/handicapService';
import { createClient } from '@/lib/supabase/client';

interface HandicapHistoryViewProps {
  userId: string;
  bagId?: string;
  showBagFilter?: boolean;
  maxRounds?: number;
}

interface BagOption {
  id: string;
  name: string;
  handicap: number | null;
}

export default function HandicapHistoryView({
  userId,
  bagId,
  showBagFilter = true,
  maxRounds = 20,
}: HandicapHistoryViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [differentials, setDifferentials] = useState<HandicapDifferential[]>([]);
  const [bags, setBags] = useState<BagOption[]>([]);
  const [selectedBagId, setSelectedBagId] = useState<string>(bagId || '');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBags = async () => {
    try {
      const supabase = createClient();
      const { data: bagsData, error: bagsError } = await supabase
        .from('bags')
        .select('id, name, handicap')
        .eq('user_id', userId)
        .order('name');

      if (bagsError) throw bagsError;
      setBags(bagsData || []);
    } catch (err) {
      console.error('Error loading bags:', err);
    }
  };

  const loadHandicapHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await getHandicapHistory(
        userId, 
        selectedBagId || undefined, 
        maxRounds
      );
      
      setDifferentials(history);
    } catch (err) {
      console.error('Error loading handicap history:', err);
      setError('Failed to load handicap history');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateHandicap = async () => {
    try {
      setUpdating(true);
      await calculateAndUpdateHandicap(userId, selectedBagId || undefined);
      await loadHandicapHistory();
      await loadBags(); // Refresh bag handicaps
    } catch (err) {
      console.error('Error recalculating handicap:', err);
      setError('Failed to recalculate handicap');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    loadBags();
  }, [userId]);

  useEffect(() => {
    loadHandicapHistory();
  }, [userId, selectedBagId, maxRounds]);

  const formatDifferential = (diff: number): string => {
    return diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  };

  const getDifferentialColor = (diff: number): 'success' | 'warning' | 'error' => {
    if (diff <= 0) return 'success';
    if (diff <= 10) return 'warning';
    return 'error';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <TrendingDownIcon color="success" fontSize="small" />;
    if (current > previous) return <TrendingUpIcon color="error" fontSize="small" />;
    return <TrendingFlatIcon color="disabled" fontSize="small" />;
  };

  const currentBag = bags.find(bag => bag.id === selectedBagId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header and Controls */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Handicap History
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2, 
          alignItems: isMobile ? 'stretch' : 'center',
          mb: 2 
        }}>
          {showBagFilter && bags.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Bag Setup</InputLabel>
              <Select
                value={selectedBagId}
                label="Bag Setup"
                onChange={(e) => setSelectedBagId(e.target.value)}
              >
                <MenuItem value="">All Bags</MenuItem>
                {bags.map((bag) => (
                  <MenuItem key={bag.id} value={bag.id}>
                    {bag.name} {bag.handicap !== null && `(${bag.handicap.toFixed(1)})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Button
            variant="outlined"
            startIcon={updating ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRecalculateHandicap}
            disabled={updating}
            size="small"
          >
            {updating ? 'Updating...' : 'Recalculate'}
          </Button>
        </Box>

        {currentBag && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {currentBag.name}
                </Typography>
                {currentBag.handicap !== null && (
                  <Chip
                    label={`Handicap: ${currentBag.handicap.toFixed(1)}`}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {differentials.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No rounds found for handicap calculation.
              {selectedBagId ? ' Try selecting a different bag or ' : ' '}
              Complete at least 3 rounds to see your handicap history.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell align="center">Rating/Slope</TableCell>
                    <TableCell align="center">Differential</TableCell>
                    {!isMobile && <TableCell align="center">Trend</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {differentials.map((diff, index) => {
                    const previousDiff = differentials[index + 1];
                    
                    return (
                      <TableRow key={diff.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(diff.round_date), 'MMM d, yyyy')}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="medium">
                            {diff.score}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {diff.course_rating.toFixed(1)}/{diff.slope_rating}
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip
                            label={formatDifferential(diff.differential)}
                            color={getDifferentialColor(diff.differential)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        
                        {!isMobile && (
                          <TableCell align="center">
                            {previousDiff && getTrendIcon(diff.differential, previousDiff.differential)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {differentials.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 2 
            }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Rounds
                </Typography>
                <Typography variant="h6">
                  {differentials.length}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Best Differential
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatDifferential(Math.min(...differentials.map(d => d.differential)))}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
                <Typography variant="h6">
                  {(differentials.reduce((sum, d) => sum + d.score, 0) / differentials.length).toFixed(1)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Recent Trend
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {differentials.length >= 2 && getTrendIcon(
                    differentials[0].differential, 
                    differentials[1].differential
                  )}
                  <Typography variant="h6">
                    {differentials.length >= 2 
                      ? formatDifferential(differentials[0].differential - differentials[1].differential)
                      : '-'
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
} 