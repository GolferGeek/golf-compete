'use client'

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
  ListItemText
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Link from 'next/link'
import PersonIcon from '@mui/icons-material/Person'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import BuildIcon from '@mui/icons-material/Build'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export default function DashboardPage() {
  const { profile } = useAuth()

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
                    Competitions
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" paragraph>
                  View, join and track your golf competitions.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                  <Button 
                    component={Link} 
                    href="/competitions" 
                    variant="outlined" 
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                  >
                    Browse Competitions
                  </Button>
                  <Button 
                    component={Link} 
                    href="/competitions/my" 
                    variant="outlined" 
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                  >
                    My Competitions
                  </Button>
                </Box>
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
                  Track issues in your game that you're working to improve.
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Add areas you are working on" 
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