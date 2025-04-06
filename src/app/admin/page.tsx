"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  useTheme,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import { getAllProfiles, getCurrentProfile, type Profile } from '@/lib/profileService';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const profilesData = await getAllProfiles();
        setProfiles(profilesData);
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Failed to load admin data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getProfileDisplayName = (profile: Profile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.username) {
      return profile.username;
    }
    return 'Unnamed User';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AdminAuthGuard>
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
          {/* Profile Management */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    Profile Management
                  </Typography>
                  <PeopleIcon color="primary" fontSize="large" />
                </Box>
                
                <List>
                  {profiles.map((profile) => (
                    <ListItem key={profile.id} divider>
                      <ListItemText 
                        primary={getProfileDisplayName(profile)}
                        secondary={profile.username || 'No username set'}
                      />
                      {profile.is_admin && (
                        <Chip 
                          label="Admin" 
                          color="primary" 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                      )}
                      <Button 
                        size="small" 
                        onClick={() => router.push(`/admin/profiles/${profile.id}`)}
                      >
                        Manage
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Course Management */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    Course Management
                  </Typography>
                  <GolfCourseIcon color="primary" fontSize="large" />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => router.push('/admin/courses/new')}
                  >
                    Add New Course
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => router.push('/admin/courses')}
                  >
                    Manage Courses
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminAuthGuard>
  );
} 