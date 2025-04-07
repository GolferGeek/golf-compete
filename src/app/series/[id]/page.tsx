'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';
import { getSeriesById } from '@/lib/series';
import { Series, SeriesStatus } from '@/types/series';
import { useAuth } from '@/contexts/AuthContext';
import { SeriesAuthGuard } from '@/components/auth/SeriesAuthGuard';

interface SeriesDetailPageProps {
  params: {
    id: string;
  };
}

function SeriesDetailContent({ seriesId }: { seriesId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusChipColor = (status: SeriesStatus) => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    async function loadSeries() {
      try {
        setLoading(true);
        const seriesData = await getSeriesById(seriesId);
        setSeries(seriesData);
      } catch (err) {
        console.error('Error loading series:', err);
        setError('Failed to load series. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, [seriesId]);

  const handleEditSeries = () => {
    router.push(`/series/${seriesId}/edit`);
  };

  const handleManageEvents = () => {
    router.push(`/series/${seriesId}/events`);
  };

  const handleManageParticipants = () => {
    try {
      console.log('Navigating to participants page for series:', seriesId);
      if (!seriesId) {
        console.error('Series ID is missing');
        setError('Cannot access participants page: Series ID is missing');
        return;
      }
      router.push(`/series/${seriesId}/participants`);
    } catch (error) {
      console.error('Error navigating to participants page:', error);
      setError('Failed to navigate to participants page. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!series) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Series not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/series" color="inherit">
            Series
          </MuiLink>
          <Typography color="text.primary">{series.name}</Typography>
        </Breadcrumbs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {series.name}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                  color={getStatusChipColor(series.status) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={series.series_type === 'season_long'
                    ? 'Season Long'
                    : series.series_type === 'match_play'
                    ? 'Match Play'
                    : 'Tournament'}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                {format(new Date(series.start_date), 'MMM d, yyyy')} - {format(new Date(series.end_date), 'MMM d, yyyy')}
              </Typography>
              {series.description && (
                <Typography variant="body1" paragraph>
                  {series.description}
                </Typography>
              )}
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EventIcon />}
                onClick={handleManageEvents}
                size={isMobile ? "large" : "medium"}
              >
                Manage Events
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={handleManageParticipants}
                size={isMobile ? "large" : "medium"}
              >
                Manage Participants
              </Button>
            </Grid>
            {series.created_by === user?.id && (
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditSeries}
                  size={isMobile ? "large" : "medium"}
                >
                  Edit Series
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  return (
    <SeriesAuthGuard seriesId={params.id}>
      <SeriesDetailContent seriesId={params.id} />
    </SeriesAuthGuard>
  );
} 