"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Container,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Paper,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';

// Icons
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';

import AdminThemeRegistry from '@/theme/AdminThemeRegistry';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, profile, isLoading, signOut } = useAuth();

  // Auth check effect
  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      console.log('Admin layout - No user, redirecting to login');
      router.push('/auth/login?redirect=/admin');
      return;
    }

    // If user exists but not admin, show access denied
    if (!isLoading && user && profile && !profile.is_admin) {
      console.log('Admin layout - User is not an admin');
      // We'll handle this in the render below
    }
  }, [isLoading, user, profile, router]);

  // Determine active tab based on current path
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin/courses')) {
      setActiveTab(0);
    } else if (path.includes('/admin/users')) {
      setActiveTab(1);
    } else {
      // Default to courses tab for the dashboard
      setActiveTab(0);
    }
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Navigate based on tab index
    switch(newValue) {
      case 0:
        router.push('/admin/courses');
        break;
      case 1:
        router.push('/admin/users');
        break;
      default:
        router.push('/admin/courses');
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <AdminThemeRegistry>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </AdminThemeRegistry>
    );
  }

  // If not admin and not loading, show access denied
  if (!isLoading && (!user || (profile && !profile.is_admin))) {
    return (
      <AdminThemeRegistry>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" paragraph>
            You do not have permission to access the admin area.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Debug info: User: {user ? 'Yes' : 'No'}, Profile: {profile ? 'Yes' : 'No'}, 
            Admin: {profile?.is_admin ? 'Yes' : 'No'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/')}
          >
            Return to Home
          </Button>
        </Box>
      </AdminThemeRegistry>
    );
  }

  return (
    <AdminThemeRegistry>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', pb: '56px' }}>
        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 1, sm: 2, md: 3 },
            bgcolor: 'background.default',
            width: '100%',
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
            {children}
          </Container>
        </Box>
        
        {/* Admin Navigation Tabs - positioned at the bottom and fixed */}
        <Paper 
          elevation={3}
          sx={{ 
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderRadius: 0
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            centered={!isMobile}
            sx={{ 
              bgcolor: 'background.paper',
              '& .MuiTab-root': {
                minHeight: '56px',
                color: 'text.primary',
              }
            }}
          >
            <Tab 
              icon={<GolfCourseIcon />} 
              label={isMobile ? undefined : "Courses"} 
              iconPosition="start"
              sx={{ 
                minWidth: isMobile ? 'auto' : '120px',
                px: isMobile ? 1 : 2
              }}
            />
            <Tab 
              icon={<PeopleIcon />}
              label={isMobile ? undefined : "Users"}
              iconPosition="start"
              sx={{ 
                minWidth: isMobile ? 'auto' : '120px',
                px: isMobile ? 1 : 2
              }}
            />
          </Tabs>
        </Paper>
      </Box>
    </AdminThemeRegistry>
  );
}