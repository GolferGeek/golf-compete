import { Box, Card, CardContent, Paper, Typography } from '@mui/material';
import { format } from 'date-fns';
import { Round } from '@/types/round';
import { getBagById } from '@/lib/bags';

interface RoundStats {
  putting?: {
    total: number;
    average: string;
  };
  fairways?: {
    hit: number;
    percentage: string;
  };
  greens?: {
    hit: number;
    percentage: string;
  };
  penalties?: {
    total: number;
  };
}

interface EventPageProps {
  round: Round;
  stats?: {
    stats: RoundStats;
    showPutts: boolean;
    showFairways: boolean;
    showGIR: boolean;
    showPenalties: boolean;
  };
  handicapDifferential?: number;
}

export default async function EventPage({ round, stats, handicapDifferential }: EventPageProps) {
  const bag = await getBagById(round.bag_id);

  return (
    <>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Box sx={{ flex: '1 1 50%' }}>
            <Typography variant="h4" gutterBottom>
              {round.course.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {format(new Date(round.date_played), 'MMMM d, yyyy')}
            </Typography>
            {bag && (
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                Bag: {bag.name} {bag.handicap && `(Handicap: ${bag.handicap})`}
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: '1 1 50%' }}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 3 }}>
              <Box>
                <Typography variant="h6">Total Score</Typography>
                <Typography variant="h4" color="primary">
                  {round.total_score}
                </Typography>
              </Box>
              {handicapDifferential && (
                <Box>
                  <Typography variant="h6">Differential</Typography>
                  <Typography variant="h4" color="secondary">
                    {handicapDifferential}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      {stats?.stats && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {stats.stats.putting && (
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Putting</Typography>
                  <Typography variant="h4">{stats.stats.putting.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.stats.putting.average} putts per hole
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
          {stats.stats.fairways && (
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Fairways</Typography>
                  <Typography variant="h4">{stats.stats.fairways.hit}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.stats.fairways.percentage}% hit
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
          {stats.stats.greens && (
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>GIR</Typography>
                  <Typography variant="h4">{stats.stats.greens.hit}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.stats.greens.percentage}% hit
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
          {stats.stats.penalties && (
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(25% - 12px)' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Penalties</Typography>
                  <Typography variant="h4">{stats.stats.penalties.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total penalty strokes
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}
    </>
  );
} 