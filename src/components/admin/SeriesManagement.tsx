"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import { format } from 'date-fns';
import { getAllSeries, deleteSeries } from '@/lib/series';
import { Series, SeriesStatus } from '@/types/series';
import { useAuth } from '@/contexts/AuthContext';

export default function SeriesManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seriesIdToDelete, setSeriesIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function loadSeries() {
      try {
        setLoading(true);
        const seriesData = await getAllSeries();
        setSeries(seriesData);
      } catch (err) {
        console.error('Error loading series:', err);
        setError('Failed to load series. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, []);

  const handleCreateSeries = () => {
    router.push('/admin/series/create');
  };

  const handleEditSeries = (id: string) => {
    router.push(`/admin/series/edit/${id}`);
  };

  const handleManageEvents = (id: string) => {
    router.push(`/admin/series/${id}/events`);
  };

  const handleManageParticipants = (id: string) => {
    router.push(`/admin/series/${id}/participants`);
  };

  const handleDeleteClick = (id: string) => {
    setSeriesIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!seriesIdToDelete) return;

    try {
      await deleteSeries(seriesIdToDelete);
      setSeries(series.filter(s => s.id !== seriesIdToDelete));
      setDeleteDialogOpen(false);
      setSeriesIdToDelete(null);
    } catch (err) {
      console.error('Error deleting series:', err);
      setError('Failed to delete series. Please try again later.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSeriesIdToDelete(null);
  };

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

  const renderMobileView = () => {
    return (
      <Grid container spacing={2}>
        {series.map((s) => (
          <Grid item xs={12} key={s.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  {s.name}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    color={getStatusChipColor(s.status) as any}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={s.series_type === 'season_long'
                      ? 'Season Long'
                      : s.series_type === 'match_play'
                      ? 'Match Play'
                      : 'Tournament'}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(s.start_date), 'MMM d, yyyy')} - {format(new Date(s.end_date), 'MMM d, yyyy')}
                </Typography>
              </CardContent>
              <CardActions sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1, pb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => handleManageEvents(s.id)}
                >
                  Events
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => handleManageParticipants(s.id)}
                >
                  Players
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditSeries(s.id)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteClick(s.id)}
                >
                  Delete
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
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {series.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  {s.series_type === 'season_long'
                    ? 'Season Long'
                    : s.series_type === 'match_play'
                    ? 'Match Play'
                    : 'Tournament'}
                </TableCell>
                <TableCell>
                  {format(new Date(s.start_date), 'MMM d, yyyy')} - {format(new Date(s.end_date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    color={getStatusChipColor(s.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleManageEvents(s.id)}
                    title="Manage Events"
                  >
                    <EventIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleManageParticipants(s.id)}
                    title="Manage Participants"
                  >
                    <PeopleIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditSeries(s.id)}
                    title="Edit Series"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(s.id)}
                    title="Delete Series"
                  >
                    <DeleteIcon />
                  </IconButton>
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography variant="h4" component="h1">
          Series Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateSeries}
          fullWidth={isMobile}
        >
          Create Series
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {series.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            No series found. Create your first series to get started.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateSeries}
          >
            Create Series
          </Button>
        </Paper>
      ) : (
        isMobile ? renderMobileView() : renderDesktopView()
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Series</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this series? This action cannot be undone and will remove all associated events and participant data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 