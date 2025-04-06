"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCurrentProfile } from '@/lib/profileService';
import type { Profile } from '@/lib/profileService';
import { getSeriesParticipantsByUserId } from '@/lib/series';
import { getEventParticipantsByUserId } from '@/lib/events';
import { format } from 'date-fns';

type SeriesParticipant = {
  id: string;
  user_id: string;
  series_id: string;
  role: string;
  status: string;
  joined_at: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  series_status: string;
};

type EventParticipant = {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  registration_date: string;
  name: string;
  description?: string;
  event_date: string;
  event_format?: string;
  event_status: string;
  course_id?: string;
  tee_time?: string;
  starting_hole?: number;
  group_number?: number;
  handicap_index?: number;
};

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [series, setSeries] = useState<SeriesParticipant[]>([]);
  const [events, setEvents] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Menu state
  const [seriesMenuAnchor, setSeriesMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [eventMenuAnchor, setEventMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const profileData = await getCurrentProfile();
        if (!profileData) {
          router.push('/auth/signin');
          return;
        }
        setProfile(profileData);

        // Load series and events
        const [seriesData, eventsData] = await Promise.all([
          getSeriesParticipantsByUserId(profileData.id),
          getEventParticipantsByUserId(profileData.id)
        ]);

        setSeries(seriesData as SeriesParticipant[]);
        setEvents(eventsData as EventParticipant[]);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const getProfileDisplayName = (profile: Profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.username) {
      return profile.username;
    }
    return 'Unnamed User';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return 'success';
      case 'pending':
      case 'invited':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
      case 'withdrawn':
      case 'no_show':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" sx={{ 
        mb: { xs: 2, sm: 3, md: 4 },
        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
      }}>
        My Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {/* Profile Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  My Profile
                </Typography>
                <PeopleIcon color="primary" fontSize="large" />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {getProfileDisplayName(profile)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {profile.username || 'No username set'}
                </Typography>
                {profile.handicap !== null && (
                  <Typography variant="body1">
                    Handicap: {profile.handicap}
                  </Typography>
                )}
                {profile.is_admin && (
                  <Chip 
                    label="Admin" 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => router.push('/profile')}>
                Edit Profile
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Golf Stats */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Golf Equipment
                </Typography>
                <GolfCourseIcon color="primary" fontSize="large" />
              </Box>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <GolfCourseIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Club Sets"
                    secondary={profile.multiple_clubs_sets ? 'Multiple Sets' : 'Single Set'}
                  />
                  <Button size="small" onClick={() => router.push('/equipment')}>
                    Manage
                  </Button>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Series Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">My Series</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/series/new')}
                >
                  Create Series
                </Button>
              </Box>

              {series.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You haven't joined any series yet.
                </Typography>
              ) : (
                <List>
                  {series.map((series) => (
                    <ListItem
                      key={series.id}
                      divider
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            setSeriesMenuAnchor(e.currentTarget);
                            setSelectedSeriesId(series.id);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={series.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={series.status}
                              size="small"
                              color={getStatusColor(series.status)}
                            />
                            <Typography variant="caption">
                              {format(new Date(series.start_date), 'MMM d, yyyy')}
                              {' - '}
                              {format(new Date(series.end_date), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Events Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">My Events</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/events/new')}
                >
                  Create Event
                </Button>
              </Box>

              {events.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You haven't joined any events yet.
                </Typography>
              ) : (
                <List>
                  {events.map((event) => (
                    <ListItem
                      key={event.id}
                      divider
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            setEventMenuAnchor(e.currentTarget);
                            setSelectedEventId(event.id);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={event.name}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={event.status}
                              size="small"
                              color={getStatusColor(event.status)}
                            />
                            <Typography variant="caption">
                              {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Series Menu */}
      <Menu
        anchorEl={seriesMenuAnchor}
        open={Boolean(seriesMenuAnchor)}
        onClose={() => {
          setSeriesMenuAnchor(null);
          setSelectedSeriesId(null);
        }}
      >
        <MenuItem onClick={() => {
          setSeriesMenuAnchor(null);
          if (selectedSeriesId) router.push(`/series/${selectedSeriesId}/edit`);
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setSeriesMenuAnchor(null);
            if (selectedSeriesId) {
              // TODO: Implement series deletion
              console.log('Delete series:', selectedSeriesId);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Event Menu */}
      <Menu
        anchorEl={eventMenuAnchor}
        open={Boolean(eventMenuAnchor)}
        onClose={() => {
          setEventMenuAnchor(null);
          setSelectedEventId(null);
        }}
      >
        <MenuItem onClick={() => {
          setEventMenuAnchor(null);
          if (selectedEventId) router.push(`/events/${selectedEventId}/edit`);
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setEventMenuAnchor(null);
            if (selectedEventId) {
              // TODO: Implement event deletion
              console.log('Delete event:', selectedEventId);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
} 