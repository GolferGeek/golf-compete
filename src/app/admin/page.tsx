"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
import { getAllProfiles } from '@/lib/apiClient/profiles';
import { type AuthProfile } from '@/services/internal/AuthService';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const theme = useTheme();
  const [profiles, setProfiles] = useState<AuthProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await getAllProfiles();
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to load profiles');
        }
        setProfiles(response.data.profiles);
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Failed to load admin data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getProfileDisplayName = (profile: AuthProfile) => {
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

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3, md: 4 } 
        }}>
          {/* Profile Management */}
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
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
          </Box>

          {/* Course Management */}
          <Box sx={{ width: '100%' }}>
            <Card sx={{ height: '100%', width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    Course Management
                  </Typography>
                  <GolfCourseIcon color="primary" fontSize="large" />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => router.push('/admin/courses/new')}
                    sx={{ flex: 1 }}
                  >
                    Add New Course
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => router.push('/admin/courses')}
                    sx={{ flex: 1 }}
                  >
                    Manage Courses
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </AdminAuthGuard>
  );
} 