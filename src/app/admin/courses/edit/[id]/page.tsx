'use client';

import React from 'react';
import { Typography, Box, Container, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import CourseFormContainer from '@/components/admin/course-form/CourseFormContainer';
import { useParams, useSearchParams } from 'next/navigation';

export default function EditCoursePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params?.id as string;
  const stepParam = searchParams?.get('step');
  const initialStep = stepParam ? parseInt(stepParam, 10) : 0;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!courseId) {
    return (
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ my: { xs: 2, sm: 3, md: 4 }, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

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
          Edit Course
        </Typography>
        <CourseFormContainer 
          initialCourseId={courseId} 
          isEditMode={true} 
          initialStep={initialStep}
          isMobile={isMobile}
        />
      </Box>
    </Container>
  );
} 