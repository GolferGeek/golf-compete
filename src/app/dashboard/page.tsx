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
  Alert,
  alpha,
  useTheme
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
  const theme = useTheme()

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

  // Card header style
  const cardHeaderStyle = {
    display: 'flex', 
    alignItems: 'center', 
    mb: 2,
    pb: 1,
    borderBottom: `1px solid ${theme.palette.divider}`
  }

  // Icon style
  const iconStyle = {
    mr: 1.5,
    p: 1,
    borderRadius: '50%',
    bgcolor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main
  }

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="600">
            Dashboard
          </Typography>
          <Button 
            component={Link} 
            href="/profile" 
            variant="outlined" 
            startIcon={<PersonIcon />}
            sx={{ 
              borderRadius: '8px',
              px: 2.5,
              py: 1
            }}
          >
            My Profile
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column',
                backgroundImage: 'linear-gradient(to right, rgba(30, 86, 49, 0.05), rgba(30, 86, 49, 0.01))',
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                borderRadius: '12px'
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="600">
                Welcome, {profile?.first_name || 'Golfer'}!
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                This is your Golf Compete dashboard. Track your competitions, practice drills, and areas for improvement.
              </Typography>
              {profile?.handicap !== null && profile?.handicap !== undefined && (
                <Box sx={{ 
                  mt: 2, 
                  display: 'inline-flex', 
                  alignItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  width: 'fit-content'
                }}>
                  <Typography variant="body2" fontWeight="500">
                    Current Handicap: <strong>{profile.handicap}</strong>
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Competitions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={cardHeaderStyle}>
                  <Box sx={iconStyle}>
                    <EmojiEventsIcon fontSize="small" />
                  </Box>
                  <Typography variant="h6">
                    My Competitions
                  </Typography>
                </Box>
                
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
                  <Box sx={{ flexGrow: 1 }}>
                    {userSeries.length === 0 && userEvents.length === 0 ? (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        You are not currently participating in any competitions.
                      </Typography>
                    ) : (
                      <>
                        {userSeries.length > 0 && (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: theme.palette.text.secondary }}>
                              Series
                            </Typography>
                            <List dense sx={{ mb: 2 }}>
                              {userSeries.map((series) => (
                                <ListItem key={series.id} disablePadding sx={{ mb: 1, px: 1, py: 0.75, borderRadius: '8px' }}>
                                  <ListItemText
                                    primary={
                                      <Link href={`/admin/series/${series.series_id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <Typography variant="body2" component="span" sx={{ fontWeight: 'medium', cursor: 'pointer', '&:hover': { color: theme.palette.primary.main } }}>
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
                                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                                        />
                                        <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
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
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: theme.palette.text.secondary }}>
                              Events
                            </Typography>
                            <List dense sx={{ mb: 2 }}>
                              {userEvents.map((event) => (
                                <ListItem key={event.id} disablePadding sx={{ mb: 1, px: 1, py: 0.75, borderRadius: '8px' }}>
                                  <ListItemText
                                    primary={
                                      <Link href={`/admin/events/${event.event_id}`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <Typography variant="body2" component="span" sx={{ fontWeight: 'medium', cursor: 'pointer', '&:hover': { color: theme.palette.primary.main } }}>
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
                                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 500 }}
                                        />
                                        <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
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
                  </Box>
                )}
                
                {profile?.is_admin && (
                  <Button 
                    component={Link} 
                    href="/admin" 
                    variant="outlined" 
                    fullWidth
                    sx={{ mt: 'auto', pt: 1.2, pb: 1.2 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Admin Dashboard
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Practice Drills */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={cardHeaderStyle}>
                  <Box sx={iconStyle}>
                    <FitnessCenterIcon fontSize="small" />
                  </Box>
                  <Typography variant="h6">
                    Practice Drills
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  Track your practice sessions and improvement over time.
                </Typography>
                
                <List dense sx={{ mb: 2, flexGrow: 1 }}>
                  <ListItem sx={{ px: 1, py: 0.75, borderRadius: '8px' }}>
                    <ListItemText 
                      primary={<Typography variant="body2" fontWeight="medium">Putting Practice</Typography>} 
                      secondary={<Typography variant="caption" color="text.secondary">Last session: Not started</Typography>} 
                    />
                  </ListItem>
                  <ListItem sx={{ px: 1, py: 0.75, borderRadius: '8px' }}>
                    <ListItemText 
                      primary={<Typography variant="body2" fontWeight="medium">Driving Range</Typography>} 
                      secondary={<Typography variant="caption" color="text.secondary">Last session: Not started</Typography>} 
                    />
                  </ListItem>
                  <ListItem sx={{ px: 1, py: 0.75, borderRadius: '8px' }}>
                    <ListItemText 
                      primary={<Typography variant="body2" fontWeight="medium">Chipping Drill</Typography>} 
                      secondary={<Typography variant="caption" color="text.secondary">Last session: Not started</Typography>} 
                    />
                  </ListItem>
                </List>
                
                <Button 
                  component={Link} 
                  href="/drills" 
                  variant="outlined" 
                  fullWidth
                  sx={{ mt: 'auto', pt: 1.2, pb: 1.2 }}
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
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={cardHeaderStyle}>
                  <Box sx={iconStyle}>
                    <BuildIcon fontSize="small" />
                  </Box>
                  <Typography variant="h6">
                    Areas for Improvement
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  Track issues in your game that you&apos;re working to improve.
                </Typography>
                
                <List dense sx={{ mb: 2, flexGrow: 1 }}>
                  <ListItem sx={{ px: 1, py: 0.75, borderRadius: '8px' }}>
                    <ListItemText 
                      primary={<Typography variant="body2" fontWeight="medium">Add areas you&apos;re working on</Typography>} 
                      secondary={<Typography variant="caption" color="text.secondary">No issues added yet</Typography>} 
                    />
                  </ListItem>
                </List>
                
                <Button 
                  component={Link} 
                  href="/improvement" 
                  variant="outlined" 
                  fullWidth
                  sx={{ mt: 'auto', pt: 1.2, pb: 1.2 }}
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