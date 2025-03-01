import React from 'react';
import { Typography, Grid, Paper, Box } from '@mui/material';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            component={Link}
            href="/admin/courses"
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: '50%',
                p: 2,
                mb: 2,
              }}
            >
              <GolfCourseIcon fontSize="large" />
            </Box>
            <Typography variant="h6" component="h2">
              Courses
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Manage golf courses, tee boxes, and hole details
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            component={Link}
            href="/admin/series"
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                borderRadius: '50%',
                p: 2,
                mb: 2,
              }}
            >
              <EventIcon fontSize="large" />
            </Box>
            <Typography variant="h6" component="h2">
              Series
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Create and manage competition series
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            component={Link}
            href="/admin/events"
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: 'success.main',
                color: 'success.contrastText',
                borderRadius: '50%',
                p: 2,
                mb: 2,
              }}
            >
              <EventIcon fontSize="large" />
            </Box>
            <Typography variant="h6" component="h2">
              Events
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Schedule and manage individual golf events
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            component={Link}
            href="/admin/users"
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: 3,
              },
            }}
          >
            <Box
              sx={{
                bgcolor: 'info.main',
                color: 'info.contrastText',
                borderRadius: '50%',
                p: 2,
                mb: 2,
              }}
            >
              <PeopleIcon fontSize="large" />
            </Box>
            <Typography variant="h6" component="h2">
              Users
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Manage user accounts and permissions
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
} 