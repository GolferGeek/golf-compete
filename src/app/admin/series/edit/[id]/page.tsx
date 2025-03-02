import React from 'react';
import { Metadata } from 'next';
import SeriesForm from '@/components/admin/SeriesForm';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Edit Series | Golf Compete',
  description: 'Edit an existing golf series or tournament',
};

interface EditSeriesPageProps {
  params: {
    id: string;
  };
}

export default async function EditSeriesPage({ params }: EditSeriesPageProps) {
  // Since this is an async server component, we don't need React.use()
  // We can directly access params.id in server components
  const seriesId = params.id;
  
  return (
    <AdminAuthGuard>
      <SeriesForm seriesId={seriesId} />
    </AdminAuthGuard>
  );
} 