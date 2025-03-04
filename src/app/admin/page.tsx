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
  useMediaQuery
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import ViewListIcon from '@mui/icons-material/ViewList';
import { format } from 'date-fns';
import { getAllSeries } from '@/lib/series';
import { getAllEvents } from '@/lib/events';

export default function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [series, setSeries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load series and events data
        const [seriesData, eventsData] = await Promise.all([
          getAllSeries(),
          getAllEvents()
        ]);
        
        setSeries(seriesData);
        setEvents(eventsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.event_date) >= now)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 5);
  };

  const getRecentSeries = () => {
    return series
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const getSeriesByStatus = (status: string) => {
    return series.filter(s => s.status === status).length;
  };

  const getEventsByStatus = (status: string) => {
    return events.filter(e => e.status === status).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const recentSeries = getRecentSeries();

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" sx={{ 
        mb: { xs: 2, sm: 3, md: 4 },
        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
      }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {/* Series Card - Combined */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Series
                </Typography>
                <ViewListIcon color="primary" fontSize="large" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                <Typography variant="h3" component="div" sx={{ 
                  mr: 2,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                }}>
                  {series.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getSeriesByStatus('upcoming')} Upcoming • {getSeriesByStatus('in_progress')} In Progress
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
                Recent Series
              </Typography>
              
              {recentSeries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No series created yet.
                </Typography>
              ) : (
                <List dense sx={{ 
                  '& .MuiListItem-root': {
                    py: 0.5
                  }
                }}>
                  {recentSeries.slice(0, 3).map((s) => (
                    <ListItem 
                      key={s.id}
                      secondaryAction={
                        <Button 
                          size="small"
                          onClick={() => router.push(`/admin/series/${s.id}`)}
                        >
                          View
                        </Button>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ViewListIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={s.name} 
                        secondary={`${s.series_type.replace('_', ' ')} • ${s.status}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => router.push('/admin/series')}>
                Manage All Series
              </Button>
              <Button size="small" color="primary" onClick={() => router.push('/admin/series/new')}>
                New Series
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Events Card - Combined */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Events
                </Typography>
                <EventIcon color="primary" fontSize="large" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                <Typography variant="h3" component="div" sx={{ 
                  mr: 2,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                }}>
                  {events.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getEventsByStatus('upcoming')} Upcoming • {getEventsByStatus('completed')} Completed
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" component="h3" sx={{ mb: 1 }}>
                Upcoming Events
              </Typography>
              
              {upcomingEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No upcoming events.
                </Typography>
              ) : (
                <List dense sx={{ 
                  '& .MuiListItem-root': {
                    py: 0.5
                  }
                }}>
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <ListItem 
                      key={event.id}
                      secondaryAction={
                        <Button 
                          size="small"
                          onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                        >
                          Edit
                        </Button>
                      }
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <EventIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={event.name} 
                        secondary={`${format(new Date(event.event_date), 'MMM d, yyyy')} • ${event.courses?.name || 'Unknown Course'}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => router.push('/admin/events')}>
                Manage All Events
              </Button>
              <Button size="small" color="primary" onClick={() => router.push('/admin/events/new')}>
                New Event
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 