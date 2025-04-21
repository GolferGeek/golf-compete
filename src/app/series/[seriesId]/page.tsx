import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSeriesById } from '@/lib/series';
import { Series, SeriesStatus } from '@/types/series';
import { Box, Typography, Button, Paper, Chip, Alert } from '@mui/material';
import Link from 'next/link';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';

export default async function SeriesPage({
  params,
}: {
  params: { seriesId: string };
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          try {
            return cookieStore.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
            }));
          } catch (error) {
            console.error('Error getting cookies:', error);
            return [];
          }
        },
        setAll: (cookies) => {
          try {
            cookies.forEach((cookie) => {
              cookieStore.set({
                name: cookie.name,
                value: cookie.value,
                ...cookie.options
              });
            });
          } catch (error) {
            console.error('Error setting cookies:', error);
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <div>Please sign in to view this series.</div>;
  }

  const series = await getSeriesById(params.seriesId);
  if (!series) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Series not found
      </Alert>
    );
  }

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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Link href="/series">Series</Link>
        <Typography color="text.primary">{series.name}</Typography>
      </Box>

      <Paper>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {series.name}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                  color={getStatusChipColor(series.status)}
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

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 auto', minWidth: { xs: '100%', sm: 'calc(33.33% - 16px)' } }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EventIcon />}
                onClick={handleManageEvents}
                size={isMobile ? "large" : "medium"}
              >
                Manage Events
              </Button>
            </Box>
            <Box sx={{ flex: '1 1 auto', minWidth: { xs: '100%', sm: 'calc(33.33% - 16px)' } }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={handleManageParticipants}
                size={isMobile ? "large" : "medium"}
              >
                Manage Participants
              </Button>
            </Box>
            {series.created_by === session.user.id && (
              <Box sx={{ flex: '1 1 auto', minWidth: { xs: '100%', sm: 'calc(33.33% - 16px)' } }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditSeries}
                  size={isMobile ? "large" : "medium"}
                >
                  Edit Series
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 