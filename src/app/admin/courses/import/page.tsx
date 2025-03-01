import React from 'react';
import { Typography, Box, Paper, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import ScorecardReader from '@/components/admin/ScorecardReader';

export default function ImportCoursePage() {
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
          Import Course from Scorecard
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <ScorecardReader />
      </Paper>
    </div>
  );
} 