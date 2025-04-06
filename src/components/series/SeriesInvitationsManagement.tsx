'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getUserInvitations, respondToInvitation } from '@/services/competition/seriesParticipantService';
import { SeriesParticipant } from '@/types/series';

export default function SeriesInvitationsManagement() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [invitations, setInvitations] = useState<SeriesParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await getUserInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load invitations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId: string, accept: boolean) => {
    try {
      setResponding(invitationId);
      await respondToInvitation(invitationId, accept ? 'active' : 'withdrawn');
      
      // Update local state
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // If accepted, navigate to the series
      if (accept) {
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation) {
          router.push(`/series/${invitation.series_id}`);
        }
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setError('Failed to respond to invitation. Please try again later.');
    } finally {
      setResponding(null);
    }
  };

  // Add a helper function for date formatting
  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const renderMobileView = () => {
    return (
      <Grid container spacing={2}>
        {invitations.map((invitation) => (
          <Grid item xs={12} key={invitation.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {invitation.series_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Invited by: {invitation.invited_by_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Invited on: {formatDate(invitation.invited_at)}
                </Typography>
                <Chip
                  label="Pending"
                  color="info"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleResponse(invitation.id, false)}
                  disabled={!!responding}
                >
                  {responding === invitation.id ? <CircularProgress size={24} /> : 'Decline'}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleResponse(invitation.id, true)}
                  disabled={!!responding}
                >
                  {responding === invitation.id ? <CircularProgress size={24} /> : 'Accept'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderDesktopView = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Series</TableCell>
              <TableCell>Invited By</TableCell>
              <TableCell>Invited On</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.series_name}</TableCell>
                <TableCell>{invitation.invited_by_name}</TableCell>
                <TableCell>{formatDate(invitation.invited_at)}</TableCell>
                <TableCell>
                  <Chip label="Pending" color="info" size="small" />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleResponse(invitation.id, false)}
                    disabled={!!responding}
                    sx={{ mr: 1 }}
                  >
                    {responding === invitation.id ? <CircularProgress size={24} /> : 'Decline'}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleResponse(invitation.id, true)}
                    disabled={!!responding}
                  >
                    {responding === invitation.id ? <CircularProgress size={24} /> : 'Accept'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
        Series Invitations
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {invitations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            You have no pending series invitations.
          </Typography>
        </Paper>
      ) : (
        isMobile ? renderMobileView() : renderDesktopView()
      )}
    </Box>
  );
} 