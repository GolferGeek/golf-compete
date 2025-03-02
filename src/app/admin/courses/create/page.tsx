import React from 'react';
import { Typography, Box } from '@mui/material';
import CourseCreationWizard from '@/components/admin/CourseCreationWizard';

export default function CreateCoursePage() {
  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Create New Course with AI
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Use our AI-powered wizard to extract course information from scorecard images
        </Typography>
      </Box>
      
      <CourseCreationWizard />
    </div>
  );
}
