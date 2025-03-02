import React from 'react';
import { Metadata } from 'next';
import SeriesForm from '@/components/admin/SeriesForm';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Create Series | Golf Compete',
  description: 'Create a new golf series or tournament',
};

export default function CreateSeriesPage() {
  return (
    <AdminAuthGuard>
      <SeriesForm />
    </AdminAuthGuard>
  );
} 