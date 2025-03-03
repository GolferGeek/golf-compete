'use client'

import { useEffect, useState } from 'react'
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import PersonIcon from '@mui/icons-material/Person'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import BuildIcon from '@mui/icons-material/Build'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { getSeriesParticipantsByUserId } from '@/lib/series'
import { getEventParticipantsByUserId } from '@/lib/events'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [userSeries, setUserSeries] = useState<any[]>([])
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserCompetitions() {
      if (!user) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Load series the user is participating in
        const seriesData = await getSeriesParticipantsByUserId(user.id)
        setUserSeries(seriesData || [])
        
        // Load events the user is participating in
        const eventsData = await getEventParticipantsByUserId(user.id)
        setUserEvents(eventsData || [])
      } catch (err) {
        console.error('Error loading user competitions:', err)
        setError('Failed to load your competitions. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    loadUserCompetitions()
  }, [user])

  // Function to get status color for chips
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return 'success'
      case 'invited':
      case 'registered':
        return 'info'
      case 'withdrawn':
      case 'no_show':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Button 
            component={Link} 
            href="/profile" 
            variant="outlined" 
            startIcon={<PersonIcon />}
          >
            My Profile
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                Welcome, {profile?.first_name || 'Golfer'}!
              </Typography>
              <Typography variant="body1">
                This is your Golf Compete dashboard. Track your competitions, practice drills, and areas for improvement.
              </Typography>
              {profile?.handicap !== null && profile?.handicap !== undefined && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Current Handicap: <strong>{profile.handicap}</strong>
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Competitions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    My Competitions
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    {userSeries.length === 0 && userEvents.length === 0 ? (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        You are not currently participating in any competitions.
                      </Typography>
                    ) : (
                      <>
                        {userSeries.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                              Series
                            </Typography>
                            <List dense>
                              {userSeries.map((series) => (
                                <ListItem key={series.id} disablePadding sx={{ mb: 1 }}>
                                  <ListItemText
                                    primary={
                                      <Link href={`/admin/series/${series.series_id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <Typography variant="body2" component="span" sx={{ fontWeight: 'medium', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                          {series.name || 'Unnamed Series'}
                                        </Typography>
                                      </Link>
                                    }
                                    secondary={
                                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Chip 
                                          label={series.status} 
                                          size="small" 
                                          color={getStatusColor(series.status) as any}
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                        <Typography variant="caption" sx={{ ml: 1 }}>
                                          {series.role === 'admin' ? 'Admin' : 'Participant'}
                                        </Typography>
                                      </Box>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </>
                        )}
                        
                        {userEvents.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                              Events
                            </Typography>
                            <List dense>
                              {userEvents.map((event) => (
                                <ListItem key={event.id} disablePadding sx={{ mb: 1 }}>
                                  <ListItemText
                                    primary={
                                      <Link href={`/admin/events/${event.event_id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <Typography variant="body2" component="span" sx={{ fontWeight: 'medium', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                          {event.name || 'Unnamed Event'}
                                        </Typography>
                                      </Link>
                                    }
                                    secondary={
                                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <Chip 
                                          label={event.status} 
                                          size="small" 
                                          color={getStatusColor(event.status) as any}
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                        <Typography variant="caption" sx={{ ml: 1 }}>
                                          {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date'}
                                        </Typography>
                                      </Box>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </>
                        )}
                      </>
                    )}
                    
                    {profile?.is_admin && (
                      <Button 
                        component={Link} 
                        href="/admin" 
                        variant="outlined" 
                        fullWidth
                        sx={{ mt: 2 }}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Admin Dashboard
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Practice Drills */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FitnessCenterIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Practice Drills
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" paragraph>
                  Track your practice sessions and improvement over time.
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Putting Practice" 
                      secondary="Last session: Not started" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Driving Range" 
                      secondary="Last session: Not started" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Chipping Drill" 
                      secondary="Last session: Not started" 
                    />
                  </ListItem>
                </List>
                <Button 
                  component={Link} 
                  href="/drills" 
                  variant="outlined" 
                  fullWidth
                  sx={{ mt: 2 }}
                  endIcon={<ArrowForwardIcon />}
                >
                  View All Drills
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Areas for Improvement */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BuildIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Areas for Improvement
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" paragraph>
                  Track issues in your game that you&apos;re working to improve.
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Add areas you&apos;re working on" 
                      secondary="No issues added yet" 
                    />
                  </ListItem>
                </List>
                <Button 
                  component={Link} 
                  href="/improvement" 
                  variant="outlined" 
                  fullWidth
                  sx={{ mt: 2 }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Manage Improvement Areas
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ProtectedRoute>
  )
} 