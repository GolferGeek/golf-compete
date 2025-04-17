'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CardActions,
  Switch,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { updateUserProfile } from '@/lib/supabase'
import Link from 'next/link'
import GolfCourseIcon from '@mui/icons-material/GolfCourse'
import SportsTennisIcon from '@mui/icons-material/SportsTennis'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import SmartToyIcon from '@mui/icons-material/SmartToy'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [handicap, setHandicap] = useState('')
  const [multipleClubsSets, setMultipleClubsSets] = useState(false)
  const [openAiApiKey, setOpenAiApiKey] = useState('')
  const [useOwnOpenAiKey, setUseOwnOpenAiKey] = useState(false)
  const [aiAssistantEnabled, setAiAssistantEnabled] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setUsername(profile.username || '')
      setHandicap(profile.handicap !== null && profile.handicap !== undefined ? String(profile.handicap) : '')
      setMultipleClubsSets(profile.multiple_clubs_sets || false)
      setOpenAiApiKey(profile.openai_api_key || '')
      setUseOwnOpenAiKey(profile.use_own_openai_key || false)
      setAiAssistantEnabled(profile.ai_assistant_enabled !== false)
    }
  }, [profile])

  const validateForm = () => {
    if (!firstName || !lastName || !username) {
      setError('First name, last name, and username are required')
      return false
    }
    
    if (handicap && isNaN(Number(handicap))) {
      setError('Handicap must be a number')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    console.log('Profile update started')
    
    if (!validateForm()) {
      console.log('Form validation failed')
      return
    }
    
    if (!user) {
      console.log('No user found')
      setError('No user found. Please sign in again.')
      setTimeout(() => router.push('/auth/login'), 2000)
      return
    }
    
    setIsLoading(true)
    console.log('Loading state set to true')

    try {
      const updates = {
        first_name: firstName,
        last_name: lastName,
        username,
        handicap: handicap ? parseFloat(handicap) : null,
        multiple_clubs_sets: multipleClubsSets,
        openai_api_key: openAiApiKey,
        use_own_openai_key: useOwnOpenAiKey,
        ai_assistant_enabled: aiAssistantEnabled,
        updated_at: new Date().toISOString()
      }
      
      console.log('Preparing to update profile with data:', updates)

      const { error, data } = await updateUserProfile(user.id, updates)
      
      console.log('Profile update response:', { error, data })
      
      if (error) {
        console.error('Profile update error from Supabase:', error)
        throw error
      }

      console.log('Profile updated successfully, refreshing profile data')
      
      // Refresh the profile data in context
      await refreshProfile()
      
      // Turn off loading state
      setIsLoading(false)
      
      // Redirect immediately to dashboard
      console.log('Redirecting to dashboard')
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error('Profile update error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  return (
    <ProtectedRoute>
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile
          </Typography>
          
          <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
            {/* Reserve space for alerts to prevent layout shift */}
            <Box sx={{ minHeight: '60px', mb: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}
            </Box>
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={theme => ({
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing(3),
              })}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </Box>
                
                <Box sx={{ width: '100%' }}>
                  <TextField
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </Box>
                
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Golf Equipment
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <GolfCourseIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">My Golf Clubs</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Manage your golf clubs inventory. Add, edit, or remove clubs from your collection.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        component={Link} 
                        href="/profile/clubs" 
                        endIcon={<ArrowForwardIcon />}
                      >
                        Manage Clubs
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SportsTennisIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">My Golf Bags</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Create and manage your golf bags. Organize your clubs into different sets for various courses and conditions.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        component={Link} 
                        href="/profile/bags" 
                        endIcon={<ArrowForwardIcon />}
                      >
                        Manage Bags
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
                
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Golf Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                   <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SmartToyIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Quick Notes</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        View and manage notes created with the AI assistant that aren't tied to specific rounds.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        component={Link} 
                        href="/profile/notes" 
                        endIcon={<ArrowForwardIcon />}
                      >
                        Manage Notes
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                  <TextField
                    fullWidth
                    id="handicap"
                    label="Handicap"
                    name="handicap"
                    type="number"
                    value={handicap}
                    onChange={(e) => setHandicap(e.target.value)}
                    disabled={isLoading}
                    helperText={multipleClubsSets 
                      ? "This handicap will be associated with your default bag" 
                      : "Leave blank if you do not have a handicap"}
                  />
                </Box>
                
                <Box sx={theme => ({
                  width: '100%', 
                  [theme.breakpoints.up('sm')]: { width: `calc(50% - ${theme.spacing(1.5)})` }
                })}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={multipleClubsSets}
                        onChange={(e) => setMultipleClubsSets(e.target.checked)}
                        name="multipleClubsSets"
                        color="primary"
                        disabled={isLoading}
                      />
                    }
                    label="I carry multiple sets of clubs"
                  />
                </Box>
                
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    AI Golf Assistant
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>
                
                <Box sx={{ width: '100%' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={aiAssistantEnabled}
                        onChange={(e) => setAiAssistantEnabled(e.target.checked)}
                        name="aiAssistantEnabled"
                        color="primary"
                        disabled={isLoading}
                      />
                    }
                    label="Enable AI Golf Assistant"
                    sx={{ display: 'block', mb: 2 }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useOwnOpenAiKey}
                        onChange={(e) => setUseOwnOpenAiKey(e.target.checked)}
                        name="useOwnOpenAiKey"
                        color="primary"
                        disabled={!aiAssistantEnabled || isLoading}
                      />
                    }
                    label="Use my own OpenAI API key (faster processing)"
                    sx={{ display: 'block', mb: 2 }}
                  />
                  
                  {!useOwnOpenAiKey && aiAssistantEnabled && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 1 }}>
                      Using the app's default API key. Processing may be slower during high traffic.
                    </Typography>
                  )}
                  
                  <Collapse in={useOwnOpenAiKey && aiAssistantEnabled}>
                    <TextField
                      fullWidth
                      id="openAiApiKey"
                      label="Your OpenAI API Key"
                      name="openAiApiKey"
                      value={openAiApiKey}
                      onChange={(e) => setOpenAiApiKey(e.target.value)}
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="sk-..."
                      autoComplete="off"
                      disabled={isLoading}
                      sx={{ mb: 1 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle api key visibility"
                              onClick={() => setShowApiKey(!showApiKey)}
                              edge="end"
                            >
                              {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Using your own API key provides faster processing on the golf course. Your key is securely stored and only used for your requests.
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3 }} variant="outlined">
                      <Typography variant="body2">
                        Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI's website</a>
                      </Typography>
                    </Alert>
                  </Collapse>
                </Box>
                
                <Box sx={{ width: '100%', mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      onClick={handleCancel}
                      variant="outlined"
                      sx={{ py: 1.5, px: 4 }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ py: 1.5, px: 4 }}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ProtectedRoute>
  )
} 