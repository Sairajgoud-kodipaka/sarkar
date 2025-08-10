'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export function AuthWrapper({ children, requiredRole }: AuthWrapperProps) {
  const { user, isLoading, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthWrapper state:', { user, isLoading, isHydrated });
    
    if (isHydrated && !isLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      if (requiredRole) {
        const userRole = user.user_metadata?.role;
        const requiredList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!userRole || !requiredList.includes(userRole)) {
          console.log(`Role access failed (have: ${userRole}, need: ${requiredList.join(', ')}). Redirecting to /login`);
          router.push('/login');
          return;
        }
      }
    }
  }, [user, isLoading, isHydrated, requiredRole, router]);

  if (isLoading || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (requiredRole) {
    const userRole = user.user_metadata?.role;
    const requiredList = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!requiredList.includes(userRole)) {
      return null; // Will redirect to login
    }
  }

  return <>{children}</>;
} 