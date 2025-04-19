"use client";

import * as React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
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
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/apiClient/auth';

const pages = [
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' }
];

export default function Navbar() {
  const { session, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  
  // Memoize user initials calculation
  const userInitials = useMemo(() => {
    if (!mounted) return '';
    
    if (profile?.first_name || profile?.last_name) {
      const firstInitial = profile.first_name ? profile.first_name.charAt(0) : '';
      const lastInitial = profile.last_name ? profile.last_name.charAt(0) : '';
      return (firstInitial + lastInitial).toUpperCase();
    } else if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return '?';
  }, [profile?.first_name, profile?.last_name, session?.user?.email, mounted]);

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

  // Update the getUserMenuItems function to only handle authenticated users
  const getUserMenuItems = useCallback(() => {
    if (!mounted || !session) return [];
    
    // Logged in user menu items
    const menuItems = [
      <MenuItem key="dashboard" component={Link} href="/dashboard" onClick={handleCloseUserMenu}>
        <Typography textAlign="center">Dashboard</Typography>
      </MenuItem>,
      <MenuItem key="notes" component={Link} href="/profile/notes" onClick={handleCloseUserMenu}>
        <Typography textAlign="center">Notes</Typography>
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
  }, [mounted, session, profile?.is_admin, handleCloseUserMenu, handleLogout]);

  // Show placeholder during loading
  if (!mounted || loading) {
    return (
      <AppBar position="static" color="default" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <GolfCourseIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
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
            {/* Mobile content */}
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />
            <GolfCourseIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <Typography
              variant="h5"
              noWrap
              component="div"
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
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />
          </Toolbar>
        </Container>
      </AppBar>
    );
  }

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
            href={mounted && session ? "/dashboard" : "/"}
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
                <MenuItem key={page.name} component={Link} href={page.href} onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <GolfCourseIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component={Link}
            href={mounted && session ? "/dashboard" : "/"}
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
                sx={{ my: 2, color: 'inherit', display: 'block' }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            {mounted && session ? (
              // User is logged in - show avatar with dropdown menu
              <>
                <Tooltip title="Open settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar>{userInitials}</Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
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
              </>
            ) : (
              // User is not logged in - show login button directly
              <Button 
                variant="contained"
                color="primary"
                component={Link} 
                href="/auth/login"
                sx={{ my: 1, ml: 1 }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
} 