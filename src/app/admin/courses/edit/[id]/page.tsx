'use client';

import React from 'react';
import { Typography, Box, Container, CircularProgress } from '@mui/material';
import CourseFormContainer from '@/components/admin/course-form/CourseFormContainer';
import { useParams, useSearchParams } from 'next/navigation';

export default function EditCoursePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params?.id as string;
  const stepParam = searchParams?.get('step');
  const initialStep = stepParam ? parseInt(stepParam, 10) : 0;

  if (!courseId) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Course
        </Typography>
        <CourseFormContainer 
          initialCourseId={courseId} 
          isEditMode={true} 
          initialStep={initialStep}
        />
      </Box>
    </Container>
  );
} 