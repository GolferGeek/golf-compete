"use client";

import React from 'react';
import EventForm from '@/components/events/EventForm';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Button } from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export default function EditEventPage({ params }: EditEventPageProps) {
  // Unwrap params using React.use() and add type assertion
  const unwrappedParams = React.use(params as any) as { id: string };
  const eventId = unwrappedParams.id;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/events" passHref legacyBehavior>
            <Button
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              color="primary"
              sx={{ mr: 2 }}
            >
              Back to Events
            </Button>
          </Link>
          <Typography color="text.primary">Edit Event</Typography>
        </Breadcrumbs>
      </Box>
      
      <EventForm eventId={eventId} />
    </Box>
  );
} 