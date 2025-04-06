'use client';

import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import SeriesForm from '@/components/series/SeriesForm';
import { getSeriesById } from '@/lib/series';

interface EditSeriesPageProps {
  params: {
    id: string;
  };
}

export default function EditSeriesPage({ params }: EditSeriesPageProps) {
  const unwrappedParams = React.use(params as any) as { id: string };
  const id = unwrappedParams.id;
  const [series, setSeries] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSeries() {
      try {
        setLoading(true);
        const seriesData = await getSeriesById(id);
        setSeries(seriesData);
      } catch (err) {
        console.error('Error loading series:', err);
        setError('Failed to load series. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, [id]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs>
          <MuiLink component={Link} href="/series" color="inherit">
            Series
          </MuiLink>
          <MuiLink component={Link} href={`/series/${id}`} color="inherit">
            {series?.name || 'Loading...'}
          </MuiLink>
          <Typography color="text.primary">Edit</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Edit Series
      </Typography>

      <SeriesForm seriesId={id} />
    </Box>
  );
} 