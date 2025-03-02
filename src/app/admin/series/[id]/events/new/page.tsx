"use client";

import React from 'react';
import EventForm from '@/components/admin/EventForm';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

interface NewSeriesEventPageProps {
  params: {
    id: string;
  };
}

export default function NewSeriesEventPage({ params }: NewSeriesEventPageProps) {
  const unwrappedParams = React.use(params as any) as { id: string };
  const seriesId = unwrappedParams.id;
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/admin" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Admin
            </MuiLink>
          </Link>
          <Link href="/admin/series" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Series
            </MuiLink>
          </Link>
          <Link href={`/admin/series/${seriesId}`} passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Series Details
            </MuiLink>
          </Link>
          <Link href={`/admin/series/${seriesId}/events`} passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Events
            </MuiLink>
          </Link>
          <Typography color="text.primary">New Event</Typography>
        </Breadcrumbs>
      </Box>
      
      <EventForm seriesId={seriesId} />
    </Box>
  );
} 