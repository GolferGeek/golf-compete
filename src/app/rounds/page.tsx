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
import { createClient } from '@/lib/supabase/client';
import SimplifiedRoundsList from '@/components/rounds/SimplifiedRoundsList';

type SortOption = 'date_desc' | 'date_asc' | 'score_asc' | 'score_desc';

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

export default function RoundsPage() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<SimplifiedRound[]>([]);
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

        const supabase = createClient();
        const { data, error: roundsError } = await supabase
          .from('rounds')
          .select(`
            *,
            courses (id, name, city, state),
            course_tees (id, name, men_rating, men_slope),
            bags (id, name, handicap)
          `)
          .eq('user_id', user.id)
          .order('round_date', { ascending: false });

        if (roundsError) throw roundsError;

        setRounds(data as SimplifiedRound[]);
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
      round.courses.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.round_date).getTime() - new Date(a.round_date).getTime();
        case 'date_asc':
          return new Date(a.round_date).getTime() - new Date(b.round_date).getTime();
        case 'score_desc':
          if (!a.total_score && !b.total_score) return 0;
          if (!a.total_score) return 1;
          if (!b.total_score) return -1;
          return b.total_score - a.total_score;
        case 'score_asc':
          if (!a.total_score && !b.total_score) return 0;
          if (!a.total_score) return 1;
          if (!b.total_score) return -1;
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
            Start Round
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

        <SimplifiedRoundsList
          rounds={filteredAndSortedRounds}
          loading={loading}
          error={error}
        />
      </Box>
    </Container>
  );
} 