'use client';
import React from 'react';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { AuthWrapper } from '@/components/auth/AuthWrapper';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper requiredRole="inhouse_sales">
      <div className="main-layout">
        <aside className="sidebar">
          <Sidebar />
        </aside>
        <header style={{ gridArea: 'header' }}>
          <Header />
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthWrapper>
  );
}