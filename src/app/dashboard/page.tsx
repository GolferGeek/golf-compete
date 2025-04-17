"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import DashboardSeriesSection from '@/components/series/DashboardSeriesSection';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Define Profile type locally based on expected API response
// (Ideally, this would come from a shared types definition, perhaps generated from OpenAPI)
// Based on src/services/internal/AuthService.ts AuthProfile interface
interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  handicap?: number;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Define Series type locally based on expected API response from /api/user/series
// Matches the UserSeriesData interface defined in the API route
interface UserSeries {
  participantId: string;
  userId: string;
  seriesId: string;
  role: string;
  participantStatus: string;
  joinedAt: string;
  seriesName: string;
  seriesDescription?: string;
  seriesStartDate: string;
  seriesEndDate: string;
  seriesStatus: string;
  seriesCreatedBy?: string;
}

// Define Event type locally based on expected API response from /api/user/events
// Matches the UserEventData interface defined in the API route
interface UserEvent {
  participantId: string;
  userId: string;
  eventId: string;
  participantStatus: string;
  registrationDate: string;
  eventName: string;
  eventDescription?: string;
  eventDate: string;
  eventFormat?: string;
  eventStatus: string;
  courseId?: string;
  teeTime?: string;
  startingHole?: number;
  groupNumber?: number;
  handicapIndex?: number;
}

export default function Dashboard() {
  // This is now the wrapped component
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Separate the content into its own component to avoid authentication/routing issues
function DashboardContent() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { profile: authProfile, session } = useAuth();
  
  // State Management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [series, setSeries] = useState<UserSeries[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Menu state
  const [seriesMenuAnchor, setSeriesMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [eventMenuAnchor, setEventMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Use the profile from AuthContext if available (this will avoid additional API call)
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
      setLoadingProfile(false);
    }
  }, [authProfile]);

  // Fetch Profile Data via API only if not already loaded from AuthContext
  useEffect(() => {
    // Skip if we already have the profile from AuthContext
    if (profile || !session) return;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError(null);
      try {
        console.log('Fetching profile from API...');
        const response = await fetch('/api/user/profile');
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Profile API: Unauthorized, redirecting to login');
            router.push('/auth/login');
            return; // Stop further execution
          }
          // Handle other non-ok responses
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
          console.log('Profile API response:', result.data);
          setProfile(result.data as Profile);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error fetching profile data from API:', err);
        // Only set error if not already set
        setError(prev => prev ?? (err instanceof Error ? err.message : 'An unexpected error occurred'));
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [router, profile, session]);

  // Fetch Series Data via API
  useEffect(() => {
    // Only run if we have session and at least one profile source is loaded
    if (!session || (!profile && !authProfile)) return; 

    const fetchSeries = async () => {
      setLoadingSeries(true);
      try {
        console.log('Fetching series from API...');
        const response = await fetch('/api/user/series');
        
        if (!response.ok) {
          // 401 should have been handled by profile fetch redirect
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
          console.log('Series API response:', result.data);
          setSeries(result.data as UserSeries[]);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch series data');
        }
      } catch (err) {
        console.error('Error fetching series data from API:', err);
        // Only set error if not already set
        setError(prev => prev ?? (err instanceof Error ? err.message : 'Error fetching series.'));
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchSeries();
  }, [session, profile, authProfile]); 

  // Fetch Events Data via API
  useEffect(() => {
    // Only run if we have session and at least one profile source is loaded
    if (!session || (!profile && !authProfile)) return; 

    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        console.log('Fetching events from API...');
        const response = await fetch('/api/user/events');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP error ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
          console.log('Events API response:', result.data);
          setEvents(result.data as UserEvent[]);
        } else {
          throw new Error(result.error?.message || 'Failed to fetch events data');
        }
      } catch (err) {
        console.error('Error fetching events data from API:', err);
        setError(prev => prev ?? (err instanceof Error ? err.message : 'Error fetching events.'));
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [session, profile, authProfile]); 

  // Combine loading states
  const isLoading = loadingProfile || loadingSeries || loadingEvents;

  // Use authProfile as fallback if profile is not loaded
  const activeProfile = profile || authProfile;

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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Display general error if profile didn't load or other errors occurred
  if (error && !activeProfile) {
      return (
          <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => router.push('/auth/login')}>
                  Go to Login
              </Button>
          </Box>
      );
  }
  
  // If profile loading failed but we proceed, ensure profile is not null
  if (!activeProfile) {
      return (
          <Box sx={{ p: 3 }}>
              <Alert severity="warning">Could not load profile information. Please try refreshing the page.</Alert>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => router.push('/auth/login')}>
                  Return to Login
              </Button>
          </Box>
      );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Display general error if it occurred */}
      {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
              {error}
          </Alert>
      )}
      <Grid container spacing={3}>
        {/* Profile Section - Use Box instead of Grid item */}
        <Box sx={{ width: '100%', p: 1.5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h1">
                    Welcome, {getProfileDisplayName(activeProfile)}!
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
        </Box>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Series Section - Re-enabled */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1.5 }}>
          <DashboardSeriesSection
            series={series}
            loading={loadingSeries}
            error={null}
            onInvitationResponse={() => { 
                // Refresh the series data
                setLoadingSeries(true);
                fetch('/api/user/series')
                  .then(response => response.json())
                  .then(result => {
                    if (result.status === 'success') {
                      setSeries(result.data as UserSeries[]);
                    }
                  })
                  .catch(err => console.error('Error refreshing series data:', err))
                  .finally(() => setLoadingSeries(false));
            }}
          /> 
        </Box>

        {/* Events Section - Updated to use UserEvent type */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, p: 1.5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Upcoming Events</Typography>
              </Box>
              {loadingEvents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : events.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You have no upcoming events.
                </Typography>
              ) : (
                <List>
                  {events.map((event) => (
                    <ListItem
                      key={event.participantId}
                      divider
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            setEventMenuAnchor(e.currentTarget);
                            setSelectedEventId(event.eventId);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={event.eventName}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={event.participantStatus}
                              size="small"
                              color={getStatusColor(event.participantStatus)}
                            />
                            <Typography variant="caption">
                              {format(new Date(event.eventDate), 'MMM d, yyyy')}
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
        </Box>
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