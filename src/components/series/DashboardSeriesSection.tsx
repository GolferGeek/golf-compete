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
import { format, isValid, parseISO } from 'date-fns';
import { respondToInvitation } from '@/api/competition/seriesParticipantService';

// Define the UserSeries interface matching the API response
// (Ideally, import from a shared types location)
interface UserSeries {
  participantId: string;
  userId: string;
  seriesId: string;
  role: string;
  participantStatus: string | null | undefined;
  joinedAt: string;
  seriesName: string;
  seriesDescription?: string;
  seriesStartDate: string;
  seriesEndDate: string;
  seriesStatus: string;
  seriesCreatedBy?: string;
}

interface Props {
  series: UserSeries[]; // Use the specific type
  loading: boolean;
  error: string | null;
  onInvitationResponse?: () => void;
}

// Helper function to safely format dates
const safeFormatDate = (dateString: string | null | undefined, formatString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid Date';
    return format(date, formatString);
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

export default function DashboardSeriesSection({ series, loading, error, onInvitationResponse }: Props) {
  const theme = useTheme();

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'default';
    
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
                key={s.participantId}
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
                    <Link href={s.participantStatus === 'invited' ? '#' : `/series/${s.seriesId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {s.seriesName}
                    </Link>
                  }
                  secondary={`${safeFormatDate(s.seriesStartDate, 'MMM d')} - ${safeFormatDate(s.seriesEndDate, 'MMM d, yyyy')}`}
                />
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Chip
                    label={s.role}
                    size="small"
                    color={s.role === 'admin' ? 'primary' : 'default'}
                  />
                  <Chip
                    label={s.participantStatus || 'unknown'}
                    size="small"
                    color={getStatusColor(s.participantStatus)}
                  />
                  {s.participantStatus === 'invited' && (
                    <ButtonGroup size="small" sx={{ ml: 'auto' }}>
                      <Button
                        onClick={() => handleInvitationResponse(s.participantId, true)}
                        color="success"
                        variant="outlined"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleInvitationResponse(s.participantId, false)}
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