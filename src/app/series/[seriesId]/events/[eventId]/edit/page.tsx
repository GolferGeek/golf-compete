"use client";

import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import EventForm from '@/components/events/EventForm';
import { getSeriesById } from '@/lib/series';

interface EditEventPageProps {
  params: {
    id: string;
    eventId: string;
  };
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const unwrappedParams = React.use(params as any) as { id: string; eventId: string };
  const seriesId = unwrappedParams.id;
  const eventId = unwrappedParams.eventId;
  const [series, setSeries] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSeries() {
      try {
        setLoading(true);
        const seriesData = await getSeriesById(seriesId);
        setSeries(seriesData);
      } catch (err) {
        console.error('Error loading series:', err);
        setError('Failed to load series. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, [seriesId]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/series" color="inherit">
            Series
          </MuiLink>
          <MuiLink component={Link} href={`/series/${seriesId}`} color="inherit">
            {series?.name || 'Loading...'}
          </MuiLink>
          <Typography color="text.primary">Edit Event</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Edit Event
      </Typography>

      <EventForm eventId={eventId} seriesId={seriesId} />
    </Box>
  );
} 