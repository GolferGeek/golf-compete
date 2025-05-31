'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getCurrentHandicap, calculateExpectedScore } from '@/lib/handicapService';

interface HandicapDisplayProps {
  userId: string;
  bagId?: string;
  courseRating?: number;
  slopeRating?: number;
  par?: number;
  showExpectedScore?: boolean;
  showRefresh?: boolean;
  variant?: 'compact' | 'detailed' | 'card';
  onRefresh?: () => void;
}

export default function HandicapDisplay({
  userId,
  bagId,
  courseRating,
  slopeRating,
  par = 72,
  showExpectedScore = false,
  showRefresh = false,
  variant = 'compact',
  onRefresh,
}: HandicapDisplayProps) {
  const [handicap, setHandicap] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHandicap = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentHandicap = await getCurrentHandicap(userId, bagId);
      setHandicap(currentHandicap);
    } catch (err) {
      console.error('Error loading handicap:', err);
      setError('Failed to load handicap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandicap();
  }, [userId, bagId]);

  const handleRefresh = () => {
    loadHandicap();
    onRefresh?.();
  };

  const expectedScore = handicap && courseRating && slopeRating 
    ? calculateExpectedScore(handicap, courseRating, slopeRating, par)
    : null;

  const formatHandicap = (hcp: number): string => {
    if (hcp === 0) return 'Scratch';
    if (hcp < 0) return `+${Math.abs(hcp).toFixed(1)}`;
    return hcp.toFixed(1);
  };

  const getHandicapColor = (hcp: number): 'primary' | 'secondary' | 'success' | 'warning' => {
    if (hcp <= 0) return 'success';
    if (hcp <= 10) return 'primary';
    if (hcp <= 20) return 'secondary';
    return 'warning';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading handicap...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ py: 0 }}>
        {error}
      </Alert>
    );
  }

  if (handicap === null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          No handicap available
        </Typography>
        <Tooltip title="Need at least 3 completed rounds to calculate handicap">
          <InfoIcon fontSize="small" color="disabled" />
        </Tooltip>
      </Box>
    );
  }

  // Compact variant - just the handicap value
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={formatHandicap(handicap)}
          color={getHandicapColor(handicap)}
          size="small"
          variant="outlined"
        />
        {showRefresh && (
          <IconButton size="small" onClick={handleRefresh}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  }

  // Detailed variant - handicap with additional info
  if (variant === 'detailed') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {bagId ? 'Bag Handicap:' : 'Handicap:'}
          </Typography>
          <Chip
            label={formatHandicap(handicap)}
            color={getHandicapColor(handicap)}
            size="small"
          />
          {showRefresh && (
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        
        {showExpectedScore && expectedScore && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Expected Score:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {expectedScore}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Card variant - full card display
  return (
    <Card>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {bagId ? 'Bag Handicap' : 'Current Handicap'}
          </Typography>
          {showRefresh && (
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h4" color={getHandicapColor(handicap)}>
            {formatHandicap(handicap)}
          </Typography>
          
          {handicap <= 10 && (
            <Chip
              icon={<TrendingUpIcon />}
              label="Low Handicap"
              color="success"
              size="small"
            />
          )}
        </Box>

        {showExpectedScore && expectedScore && courseRating && slopeRating && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Expected Score for this Course
            </Typography>
            <Typography variant="h6" color="primary">
              {expectedScore}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Based on course rating {courseRating} and slope {slopeRating}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Calculated using World Handicap System (WHS)
          </Typography>
          <Tooltip title="Based on best 8 of your most recent 20 rounds">
            <InfoIcon fontSize="small" color="disabled" />
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
} 