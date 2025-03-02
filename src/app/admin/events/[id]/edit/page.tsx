"use client";

import React from 'react';
import EventForm from '@/components/admin/EventForm';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

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
          <Link href="/admin" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Admin
            </MuiLink>
          </Link>
          <Link href="/admin/events" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Events
            </MuiLink>
          </Link>
          <Typography color="text.primary">Edit Event</Typography>
        </Breadcrumbs>
      </Box>
      
      <EventForm eventId={eventId} />
    </Box>
  );
} 