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
import DashboardSeriesSection from '@/components/series/DashboardSeriesSection';

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
  created_by?: string;
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

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      const profileData = await getCurrentProfile();
      if (!profileData) {
        console.log('No profile data found, redirecting to signin');
        router.push('/auth/signin');
        return;
      }
      console.log('Profile data loaded:', profileData);
      setProfile(profileData);

      // Load series and events
      console.log('Loading series and events for user:', profileData.id);
      const [seriesData, eventsData] = await Promise.all([
        getSeriesParticipantsByUserId(profileData.id),
        getEventParticipantsByUserId(profileData.id)
      ]);

      console.log('Series data loaded:', seriesData);
      console.log('Events data loaded:', eventsData);

      setSeries(seriesData as unknown as SeriesParticipant[]);
      setEvents(eventsData as EventParticipant[]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Grid container spacing={3}>
        {/* Profile Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h1">
                    Welcome, {profile ? getProfileDisplayName(profile) : 'Golfer'}!
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<GolfCourseIcon />}
                  onClick={() => router.push('/series')}
                >
                  View All Series
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => router.push('/dashboard/invitations')}
                >
                  View Invitations
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => router.push('/profile')}
                >
                  Profile Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Series Section */}
        <Grid item xs={12} md={6}>
          <DashboardSeriesSection
            series={series}
            loading={loading}
            error={error}
            onInvitationResponse={loadData}
          />
        </Grid>

        {/* Events Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Upcoming Events</Typography>
              </Box>

              {events.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You have no upcoming events.
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
          if (selectedEventId) router.push(`/events/${selectedEventId}`);
        }}>
          View Details
        </MenuItem>
      </Menu>
    </Box>
  );
} 