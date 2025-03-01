import React from 'react';
import { Typography, Box, Paper, Button, Tabs, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import CourseHoleDetails from '@/components/admin/CourseHoleDetails';
import { supabaseClient } from '@/lib/auth';

interface CourseDetailPageProps {
  params: {
    id: string;
  };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/courses"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Courses
        </Button>
        <Typography variant="h4" component="h1">
          Course Details
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <CourseHoleDetails courseId={params.id} />
      </Paper>
    </div>
  );
} 