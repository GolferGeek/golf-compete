'use client';

import React from 'react';
import { Typography, Button, Box, Paper, useMediaQuery, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import CoursesList from '@/components/admin/CoursesList';

export default function CoursesManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' }
          }}
        >
          Courses Management
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/courses/new"
            fullWidth={isMobile}
            sx={{
              whiteSpace: 'nowrap'
            }}
          >
            Add Course
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: { xs: 1, sm: 2 }, overflow: 'hidden' }}>
        <CoursesList />
      </Paper>
    </Box>
  );
} 