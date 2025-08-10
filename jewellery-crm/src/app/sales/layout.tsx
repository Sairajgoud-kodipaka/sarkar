'use client';
import React from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole={["sales_associate", "inhouse_sales"]}>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthWrapper>
  );
}