'use client';

import React from 'react';
import { Typography, Box, Container, useTheme, useMediaQuery } from '@mui/material';
import CourseFormContainer from '@/components/admin/course-form/CourseFormContainer';

export default function NewCoursePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ my: { xs: 2, sm: 3, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            mb: { xs: 2, sm: 3 }
          }}
        >
          Create New Course
        </Typography>
        <CourseFormContainer isMobile={isMobile} />
      </Box>
    </Container>
  );
} 