"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase';
import { getBrowserClient } from '@/lib/supabase-browser';

const pages = [
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' }
];

export default function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted flag to true when component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    await signOut();
    router.push('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile) {
      const firstInitial = profile.first_name ? profile.first_name.charAt(0) : '';
      const lastInitial = profile.last_name ? profile.last_name.charAt(0) : '';
      return (firstInitial + lastInitial).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  // Add the checkAuthState function
  const checkAuthState = async () => {
    try {
      // Get the current Supabase client
      const supabase = getBrowserClient();
      
      if (!supabase) {
        console.error('Supabase client is null');
        return;
      }
      
      // Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('=== AUTH DEBUG ===');
      console.log('Supabase Session:', session ? 'Active' : 'None');
      if (session) {
        console.log('User ID:', session.user.id);
        console.log('User Email:', session.user.email);
        console.log('Session Expires:', session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown');
      }
      if (sessionError) {
        console.error('Session Error:', sessionError);
      }
      
      // Check for user profile if session exists
      if (session) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        console.log('Profile Data:', profileData);
        if (profileError) {
          console.error('Profile Error:', profileError);
        }
      }
      
      // Check AuthContext state
      console.log('AuthContext State:');
      console.log('User:', user ? 'Present' : 'None');
      console.log('Profile:', profile ? 'Present' : 'None');
      if (profile) {
        console.log('Is Admin:', profile.is_admin ? 'Yes' : 'No');
      }
      
      console.log('==================');
    } catch (error) {
      console.error('Error checking auth state:', error);
    }
  };

  // Generate menu items based on authentication status
  const getUserMenuItems = () => {
    if (mounted && user) {
      // Logged in user menu items
      const menuItems = [
        <MenuItem key="dashboard" component={Link} href="/dashboard" onClick={handleCloseUserMenu}>
          <Typography textAlign="center">Dashboard</Typography>
        </MenuItem>
      ];
      
      // Add admin menu item if user is admin
      if (profile?.is_admin) {
        menuItems.push(
          <MenuItem key="admin" component={Link} href="/admin" onClick={handleCloseUserMenu}>
            <Typography textAlign="center">Admin</Typography>
          </MenuItem>
        );
      }
      
      // Add profile and logout items
      menuItems.push(
        <MenuItem key="profile" component={Link} href="/profile" onClick={handleCloseUserMenu}>
          <Typography textAlign="center">Profile</Typography>
        </MenuItem>,
        <MenuItem key="logout" onClick={handleLogout}>
          <Typography textAlign="center">Logout</Typography>
        </MenuItem>
      );
      
      return menuItems;
    } else {
      // Not logged in - only show Login option
      return [
        <MenuItem key="login" component={Link} href="/auth/login" onClick={handleCloseUserMenu}>
          <Typography textAlign="center">Login</Typography>
        </MenuItem>
      ];
    }
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop Logo */}
          <GolfCourseIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            href={mounted && user ? "/dashboard" : "/"}
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            GolfCompete
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={handleCloseNavMenu} component={Link} href={page.href}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
              {mounted && user && (
                <MenuItem onClick={handleCloseNavMenu} component={Link} href="/dashboard">
                  <Typography textAlign="center">Dashboard</Typography>
                </MenuItem>
              )}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <GolfCourseIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            href={mounted && user ? "/dashboard" : "/"}
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            GolfCompete
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                href={page.href}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'text.primary', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
            {mounted && user && (
              <Button
                component={Link}
                href="/dashboard"
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: 'text.primary', display: 'block' }}
              >
                Dashboard
              </Button>
            )}
          </Box>

          {/* User Menu - Always Visible */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Account menu">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                {mounted && user ? (
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getUserInitials()}
                  </Avatar>
                ) : (
                  <Avatar sx={{ bgcolor: 'grey.300' }}>
                    <PersonIcon color="action" />
                  </Avatar>
                )}
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar-user"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {getUserMenuItems()}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
} 