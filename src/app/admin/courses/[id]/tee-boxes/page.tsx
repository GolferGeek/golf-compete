"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function TeeBoxesRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      // Redirect to the course edit page with a query parameter to indicate the active step
      router.push(`/admin/courses/edit/${id}?step=1`);
    }
  }, [id, router]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6">Redirecting to Tee Boxes editor...</Typography>
    </Box>
  );
} 