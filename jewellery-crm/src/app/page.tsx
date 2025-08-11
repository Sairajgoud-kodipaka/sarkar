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
    if (isHydrated && !isLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      
      if (user) {
        // User is authenticated, redirect based on role
        const userRole = user.user_metadata?.role;
        const roleRoutes: Record<string, string> = {
          business_admin: '/business-admin/dashboard',
          sales_associate: '/sales/dashboard',
          floor_manager: '/floor-manager/dashboard',
          inhouse_sales: '/sales/dashboard',
        };
        
        const route = roleRoutes[userRole] || '/login';
        console.log('🏠 Home page: User authenticated, redirecting to:', route);
        router.replace(route);
      } else {
        // No user, redirect to login
        console.log('🏠 Home page: No user, redirecting to login');
        router.replace('/login');
      }
    }
  }, [user, isLoading, isHydrated, router]);

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
