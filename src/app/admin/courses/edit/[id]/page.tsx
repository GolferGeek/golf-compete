import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import CourseForm from '@/components/admin/CourseForm';

export default function EditCoursePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Edit Course
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <CourseForm courseId={params.id} />
      </Paper>
    </div>
  );
} 