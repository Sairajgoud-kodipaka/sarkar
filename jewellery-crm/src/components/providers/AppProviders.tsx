'use client';

import React, { useEffect } from 'react';
import { NotificationProvider } from '@/hooks/useNotifications';
import { NotificationManager } from '@/components/notifications';
import { ThemeProvider } from './ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

// Auth Provider Component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isLoading } = useAuth();

  useEffect(() => {
    // Initialize authentication state when app loads
    initialize();
  }, [initialize]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
        <NotificationManager />
      </NotificationProvider>
    </ThemeProvider>
  );
}; 