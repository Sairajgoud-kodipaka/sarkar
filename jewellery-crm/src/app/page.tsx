'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthInitialization } from '@/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInitialized, isLoading, isHydrated } = useAuthInitialization();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      
      // Get user role and redirect accordingly
      const userRole = user.user_metadata?.role || 'user';
      
      // Redirect to role-based route
      if (userRole === 'business_admin') {
        router.push('/business-admin/dashboard');
      } else if (userRole === 'floor_manager') {
        router.push('/floor-manager/dashboard');
      } else if (userRole === 'sales') {
        router.push('/sales/dashboard');
      } else {
        router.push('/platform/dashboard');
      }
    }
  }, [user, router]);

  // Show loading while checking auth
  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
