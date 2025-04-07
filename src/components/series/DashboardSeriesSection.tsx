'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  ButtonGroup,
} from '@mui/material';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { format } from 'date-fns';
import { respondToInvitation } from '@/services/competition/seriesParticipantService';

interface Props {
  series: any[];
  loading: boolean;
  error: string | null;
  onInvitationResponse?: () => void;
}

export default function DashboardSeriesSection({ series, loading, error, onInvitationResponse }: Props) {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return 'success';
      case 'invited':
      case 'registered':
        return 'warning';
      case 'withdrawn':
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleInvitationResponse = async (participantId: string, accept: boolean) => {
    try {
      await respondToInvitation(participantId, accept);
      if (onInvitationResponse) {
        onInvitationResponse();
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2,
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{
              mr: 1.5,
              p: 1,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main
            }}>
              <EmojiEventsIcon />
            </Box>
            <Typography variant="h6" component="h2">
              My Series
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/series/create"
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
          >
            Create Series
          </Button>
        </Box>

        {series.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography color="text.secondary" gutterBottom>
              You haven't joined any series yet.
            </Typography>
            <Button
              component={Link}
              href="/series"
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
            >
              Browse Series
            </Button>
          </Box>
        ) : (
          <List>
            {series.slice(0, 3).map((s) => (
              <ListItem
                key={s.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Link href={s.status === 'invited' ? '#' : `/series/${s.series_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {s.name}
                    </Link>
                  }
                  secondary={`${format(new Date(s.start_date), 'MMM d')} - ${format(
                    new Date(s.end_date),
                    'MMM d, yyyy'
                  )}`}
                />
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Chip
                    label={s.role}
                    size="small"
                    color={s.role === 'admin' ? 'primary' : 'default'}
                  />
                  <Chip
                    label={s.status}
                    size="small"
                    color={getStatusColor(s.status)}
                  />
                  {s.status === 'invited' && (
                    <ButtonGroup size="small" sx={{ ml: 'auto' }}>
                      <Button
                        onClick={() => handleInvitationResponse(s.id, true)}
                        color="success"
                        variant="outlined"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleInvitationResponse(s.id, false)}
                        color="error"
                        variant="outlined"
                      >
                        Decline
                      </Button>
                    </ButtonGroup>
                  )}
                </Box>
              </ListItem>
            ))}
            {series.length > 3 && (
              <ListItem
                component={Link}
                href="/series"
                sx={{
                  justifyContent: 'center',
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Typography variant="body2">
                  View All Series ({series.length})
                </Typography>
              </ListItem>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
} 