'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export function AuthWrapper({ children, requiredRole }: AuthWrapperProps) {
  const { user, isLoading, isHydrated } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run once when auth is ready and prevent multiple redirects
    if (hasRedirected.current || !isHydrated || isLoading) {
      return;
    }

    if (!user) {
      hasRedirected.current = true;
      window.location.href = '/login';
      return;
    }

    if (requiredRole) {
      const userRole = user.user_metadata?.role;
      const requiredList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!userRole || !requiredList.includes(userRole)) {
        hasRedirected.current = true;
        window.location.href = '/login';
        return;
      }
    }
  }, [user, isLoading, isHydrated, requiredRole]);

  // Show loading while auth is initializing
  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Authenticating...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Don't render if role check fails
  if (requiredRole) {
    const userRole = user.user_metadata?.role;
    const requiredList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!requiredList.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <p className="text-gray-800 text-xl font-semibold mb-2">Access Denied</p>
            <p className="text-gray-600">You don't have permission to access this page</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to login...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
} 