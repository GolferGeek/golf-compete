import React from 'react';
import { Metadata } from 'next';
import SeriesManagement from '@/components/admin/SeriesManagement';
import { AdminAuthGuard } from '@/components/auth/AdminAuthGuard';

export const metadata: Metadata = {
  title: 'Series Management | Golf Compete',
  description: 'Manage golf series and tournaments',
};

export default function SeriesManagementPage() {
  return (
    <AdminAuthGuard>
      <SeriesManagement />
    </AdminAuthGuard>
  );
} 