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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ViewListIcon from '@mui/icons-material/ViewList';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import AddIcon from '@mui/icons-material/Add';
import { format } from 'date-fns';
import { getAllSeries } from '@/lib/series';
import { getAllEvents } from '@/lib/events';

export default function AdminDashboard() {
  const router = useRouter();
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
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Total Series
                </Typography>
                <ViewListIcon color="primary" fontSize="large" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2, mb: 1 }}>
                {series.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getSeriesByStatus('upcoming')} Upcoming • {getSeriesByStatus('in_progress')} In Progress
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button size="small" onClick={() => router.push('/admin/series')}>
                Manage Series
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Total Events
                </Typography>
                <EventIcon color="primary" fontSize="large" />
              </Box>
              <Typography variant="h3" component="div" sx={{ mt: 2, mb: 1 }}>
                {events.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getEventsByStatus('upcoming')} Upcoming • {getEventsByStatus('completed')} Completed
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button size="small" onClick={() => router.push('/admin/events')}>
                Manage Events
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Quick Actions
                </Typography>
                <AddIcon color="primary" fontSize="large" />
              </Box>
              <Box sx={{ mt: 2, flexGrow: 1 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1 }}
                  onClick={() => router.push('/admin/series/new')}
                >
                  New Series
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1 }}
                  onClick={() => router.push('/admin/events/new')}
                >
                  New Event
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div">
                  Management
                </Typography>
                <GolfCourseIcon color="primary" fontSize="large" />
              </Box>
              <Box sx={{ mt: 2, flexGrow: 1 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1 }}
                  onClick={() => router.push('/admin/courses')}
                >
                  Manage Courses
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1 }}
                  onClick={() => router.push('/admin/users')}
                >
                  Manage Users
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Upcoming Events
            </Typography>
            {upcomingEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No upcoming events.
              </Typography>
            ) : (
              <List>
                {upcomingEvents.map((event) => (
                  <ListItem 
                    key={event.id}
                    secondaryAction={
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                      >
                        Edit
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={event.name} 
                      secondary={`${format(new Date(event.event_date), 'MMM d, yyyy')} • ${event.courses?.name || 'Unknown Course'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button 
                color="primary"
                onClick={() => router.push('/admin/events')}
              >
                View All Events
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Recent Series
            </Typography>
            {recentSeries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No series created yet.
              </Typography>
            ) : (
              <List>
                {recentSeries.map((s) => (
                  <ListItem 
                    key={s.id}
                    secondaryAction={
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => router.push(`/admin/series/${s.id}`)}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <ViewListIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={s.name} 
                      secondary={`${s.series_type.replace('_', ' ')} • ${s.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button 
                color="primary"
                onClick={() => router.push('/admin/series')}
              >
                View All Series
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 