'use client';
import React from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function FloorManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole="floor_manager">
      <AppLayout>
        {children}
      </AppLayout>
    </AuthWrapper>
  );
}
