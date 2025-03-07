'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { RoundWithDetails } from '@/types/round';
import { supabaseClient } from '@/lib/auth';
import RecentRounds from '@/components/rounds/RecentRounds';

type SortOption = 'date_desc' | 'date_asc' | 'score_asc' | 'score_desc';

export default function RoundsPage() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<RoundWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  useEffect(() => {
    const loadRounds = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: roundsError } = await supabaseClient
          .from('rounds')
          .select(`
            *,
            course:courses(id, name, city, state),
            tee_set:tee_sets(id, name, color, rating, slope, length),
            bag:bags(id, name, description, handicap),
            hole_scores(*)
          `)
          .eq('user_id', user.id)
          .order('date_played', { ascending: false });

        if (roundsError) throw roundsError;

        setRounds(data as RoundWithDetails[]);
      } catch (error) {
        console.error('Error loading rounds:', error);
        setError('Failed to load rounds');
      } finally {
        setLoading(false);
      }
    };

    loadRounds();
  }, [user]);

  const filteredAndSortedRounds = rounds
    .filter(round => 
      searchTerm === '' || 
      round.course.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.date_played).getTime() - new Date(a.date_played).getTime();
        case 'date_asc':
          return new Date(a.date_played).getTime() - new Date(b.date_played).getTime();
        case 'score_desc':
          return b.total_score - a.total_score;
        case 'score_asc':
          return a.total_score - b.total_score;
        default:
          return 0;
      }
    });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            My Rounds
          </Typography>
          <Button
            component={Link}
            href="/rounds/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Play Round
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Courses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="date_desc">Date (Newest First)</MenuItem>
                  <MenuItem value="date_asc">Date (Oldest First)</MenuItem>
                  <MenuItem value="score_asc">Score (Low to High)</MenuItem>
                  <MenuItem value="score_desc">Score (High to Low)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <RecentRounds
          rounds={filteredAndSortedRounds}
          loading={loading}
          error={error}
          limit={filteredAndSortedRounds.length}
          showViewAll={false}
        />
      </Box>
    </Container>
  );
} 