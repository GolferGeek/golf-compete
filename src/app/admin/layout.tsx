"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Container, 
  Tooltip, 
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import EventIcon from '@mui/icons-material/Event';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminThemeRegistry from '@/theme/AdminThemeRegistry';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        console.log('Checking auth in admin layout');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Session found in admin layout');
          setUser(session.user);
          
          // Check if user is admin
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
            
          if (profileData?.is_admin) {
            console.log('User is admin');
            setIsAdmin(true);
          } else {
            console.log('User is not admin');
            if (window.location.pathname.startsWith('/admin')) {
              // Only redirect if we're on an admin page and not admin
              router.push('/');
            }
          }
        } else {
          console.log('No session found in admin layout');
          if (window.location.pathname.startsWith('/admin')) {
            // Only redirect if not authenticated and on admin page
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session) {
          // User is signed in
          console.log('Session found in auth state change');
          setUser(session.user);
          
          // Check if user is admin
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', session.user.id)
              .single();
              
            if (profileData?.is_admin) {
              console.log('User is admin in auth state change');
              setIsAdmin(true);
            } else {
              console.log('User is not admin in auth state change');
              if (window.location.pathname.startsWith('/admin')) {
                // Only redirect if we're on an admin page and not admin
                router.push('/');
              }
            }
          } catch (error) {
            console.error('Error checking admin status:', error);
          }
        } else {
          // User is signed out
          console.log('No session in auth state change');
          setUser(null);
          setIsAdmin(false);
          
          if (window.location.pathname.startsWith('/admin')) {
            // Only redirect if on admin page
            router.push('/auth/login');
          }
        }
        
        setLoading(false);
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, href: '/admin' },
    { text: 'Courses', icon: <GolfCourseIcon />, href: '/admin/courses' },
    { text: 'Series', icon: <EmojiEventsIcon />, href: '/admin/series' },
    { text: 'Events', icon: <EventIcon />, href: '/admin/events' },
    { text: 'Settings', icon: <SettingsIcon />, href: '/admin/settings' },
  ];

  // Show loading state while checking authentication
  if (loading) {
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
  if (!isAdmin && !loading) {
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
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
        {/* Top Navigation Bar */}
        <AppBar 
          position="static" 
          color="primary"
          sx={{ 
            width: '100%',
            height: '64px',
            boxShadow: 3
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                onClick={toggleDrawer}
                edge="start"
                sx={{ mr: 2 }}
              >
                {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
              <Typography variant="h6" noWrap component="div">
                Golf Compete Admin
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Profile">
                <IconButton color="inherit">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    <AccountCircleIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* Content Area with Side Navigation */}
        <Box sx={{ display: 'flex', flex: 1 }}>
          {/* Side Navigation */}
          <Box 
            component="nav"
            sx={{ 
              width: drawerOpen ? '240px' : '64px', 
              flexShrink: 0,
              bgcolor: 'background.paper',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              transition: 'width 0.2s ease-in-out',
              overflowX: 'hidden'
            }}
          >
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                  <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemButton
                      sx={{
                        minHeight: 48,
                        justifyContent: drawerOpen ? 'initial' : 'center',
                        px: 2.5,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: drawerOpen ? 3 : 'auto',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        sx={{ opacity: drawerOpen ? 1 : 0 }} 
                      />
                    </ListItemButton>
                  </Link>
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={handleSignOut}
                  sx={{
                    minHeight: 48,
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sign Out" 
                    sx={{ opacity: drawerOpen ? 1 : 0 }} 
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
          
          {/* Main Content */}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: 3,
              bgcolor: 'background.default',
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            <Container maxWidth="xl">
              {children}
            </Container>
          </Box>
        </Box>
      </Box>
    </AdminThemeRegistry>
  );
}