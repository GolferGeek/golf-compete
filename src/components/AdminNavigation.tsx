"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import EventIcon from '@mui/icons-material/Event';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

interface AdminNavigationProps {
  open?: boolean;
}

export default function AdminNavigation({ open = true }: AdminNavigationProps) {
  const pathname = usePathname();

  const isSelected = (path: string) => {
    return pathname?.startsWith(path) ?? false;
  };

  const menuItems = [
    { text: 'Courses', icon: <GolfCourseIcon />, path: '/admin/courses' },
    { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 64,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 64,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden',
          mt: '64px', // Add top margin to position below AppBar
          height: 'calc(100% - 64px)', // Adjust height to account for AppBar
          pt: 0, // Remove any padding
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center' }}>
        {open ? (
          <Typography variant="h6" noWrap component="div">
            Golf Compete
          </Typography>
        ) : (
          <GolfCourseIcon color="primary" />
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Link key={item.text} href={item.path} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  bgcolor: isSelected(item.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  '&:hover': {
                    bgcolor: isSelected(item.path) ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: isSelected(item.path) ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    color: isSelected(item.path) ? 'primary.main' : 'inherit',
                  }} 
                />
              </ListItemButton>
            </ListItem>
          </Link>
        ))}
      </List>
    </Drawer>
  );
} 