'use client';

import React from 'react';
import SeriesForm from '@/components/series/SeriesForm';
import { Box } from '@mui/material';

export default function CreateSeriesPage() {
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <SeriesForm />
    </Box>
  );
} 