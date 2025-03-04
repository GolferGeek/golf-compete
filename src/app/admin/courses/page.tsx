import React from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import CoursesList from '@/components/admin/CoursesList';

export default function CoursesManagement() {
  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Courses Management
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            href="/admin/courses/new"
          >
            Add Course
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2 }}>
        <CoursesList />
      </Paper>
    </div>
  );
} 