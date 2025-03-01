import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import CourseForm from '@/components/admin/CourseForm';

export default function AddCoursePage() {
  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Add New Course
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <CourseForm />
      </Paper>
    </div>
  );
} 