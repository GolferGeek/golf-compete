"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { format, isAfter, parseISO } from 'date-fns';
import { createSeries, getSeriesById, updateSeries } from '@/lib/series';
import { Series, SeriesType } from '@/types/series';
import { useAuth } from '@/contexts/AuthContext';

interface SeriesFormProps {
  seriesId?: string;
}

export default function SeriesForm({ seriesId }: SeriesFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEditMode = !!seriesId;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seriesType, setSeriesType] = useState<SeriesType>('season_long');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [scoringSystem, setScoringSystem] = useState('');

  useEffect(() => {
    async function loadSeries() {
      if (!seriesId) return;

      try {
        setLoading(true);
        const seriesData = await getSeriesById(seriesId);
        
        setName(seriesData.name);
        setDescription(seriesData.description || '');
        setSeriesType(seriesData.series_type);
        setStartDate(parseISO(seriesData.start_date));
        setEndDate(parseISO(seriesData.end_date));
        setScoringSystem(seriesData.scoring_system ? JSON.stringify(seriesData.scoring_system, null, 2) : '');
      } catch (err) {
        console.error('Error loading series:', err);
        setError('Failed to load series data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, [seriesId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    }

    if (startDate && endDate && isAfter(startDate, endDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (scoringSystem) {
      try {
        JSON.parse(scoringSystem);
      } catch (err) {
        errors.scoringSystem = 'Invalid JSON format';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError('You must be logged in to create or edit a series');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const seriesData = {
        name,
        description: description || null,
        series_type: seriesType,
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        scoring_system: scoringSystem ? JSON.parse(scoringSystem) : null,
        status: 'upcoming' as const,
        is_active: true,
        created_by: user.id,
      };

      if (isEditMode) {
        await updateSeries(seriesId, seriesData);
      } else {
        await createSeries(seriesData);
      }

      router.push('/admin/series');
    } catch (err) {
      console.error('Error saving series:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} series. Please try again later.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date to YYYY-MM-DD for input type="date"
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Parse date from YYYY-MM-DD string
  const parseInputDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Edit Series' : 'Create New Series'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Series Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.seriesType} size="small">
                <InputLabel>Series Type</InputLabel>
                <Select
                  value={seriesType}
                  onChange={(e) => setSeriesType(e.target.value as SeriesType)}
                  label="Series Type"
                  disabled={submitting}
                >
                  <MenuItem value="season_long">Season Long</MenuItem>
                  <MenuItem value="match_play">Match Play</MenuItem>
                  <MenuItem value="tournament">Tournament</MenuItem>
                </Select>
                {formErrors.seriesType && (
                  <FormHelperText>{formErrors.seriesType}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startDate ? formatDateForInput(startDate) : ''}
                onChange={(e) => setStartDate(parseInputDate(e.target.value))}
                error={!!formErrors.startDate}
                helperText={formErrors.startDate}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endDate ? formatDateForInput(endDate) : ''}
                onChange={(e) => setEndDate(parseInputDate(e.target.value))}
                error={!!formErrors.endDate}
                helperText={formErrors.endDate}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Scoring System (JSON)"
                fullWidth
                multiline
                rows={4}
                value={scoringSystem}
                onChange={(e) => setScoringSystem(e.target.value)}
                error={!!formErrors.scoringSystem}
                helperText={formErrors.scoringSystem || 'Enter scoring system as JSON object'}
                disabled={submitting}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/admin/series')}
                disabled={submitting}
                sx={{ minWidth: '120px', mb: { xs: 1, sm: 0 } }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
                sx={{ minWidth: '120px' }}
              >
                {submitting ? (
                  <CircularProgress size={24} />
                ) : isEditMode ? (
                  'Update Series'
                ) : (
                  'Create Series'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
} 