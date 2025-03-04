'use client';

import React from 'react';
import { Typography, Box, Container } from '@mui/material';
import CourseFormContainer from '@/components/admin/course-form/CourseFormContainer';

export default function NewCoursePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Course
        </Typography>
        <CourseFormContainer />
      </Box>
    </Container>
  );
} 