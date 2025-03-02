import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import CourseForm from '@/components/admin/CourseForm';

export default function EditCoursePage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use() and add type assertion
  const unwrappedParams = React.use(params as any) as { id: string };
  const courseId = unwrappedParams.id;

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Edit Course
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <CourseForm courseId={courseId} />
      </Paper>
    </div>
  );
} 