'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, Building2, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthInitialization } from '@/hooks/useAuth';
import { auth } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, isLoading, error, user, setError, initialize } = useAuth();
  const { isInitialized, isLoading: isAuthLoading } = useAuthInitialization();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'business_admin' | 'floor_manager' | 'inhouse_sales'>('inhouse_sales');
  const [floor, setFloor] = useState(1);
  const [loginError, setLoginError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  const isRedirectingRef = useRef(false);
  const routerRef = useRef(router);

  // Update router ref when router changes
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    if (user && !isRedirectingRef.current) {
      isRedirectingRef.current = true;
      
      // Get user role and redirect accordingly
      const userRole = user.user_metadata?.role || 'user';
      
      // Redirect to role-based route
      if (userRole === 'business_admin') {
        routerRef.current.push('/business-admin/dashboard');
      } else if (userRole === 'floor_manager') {
        routerRef.current.push('/floor-manager/dashboard');
      } else if (userRole === 'sales') {
        routerRef.current.push('/sales/dashboard');
      } else {
        // Don't redirect if no role - stay on login page
        setLoginError('No role assigned. Please contact admin.');
        return;
      }
    }
  }, [user]); // Removed router from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRedirectingRef.current = false;
    };
  }, []);

  const roleRoutes: Record<string, string> = {
    business_admin: '/business-admin/dashboard',
    sales_associate: '/sales/dashboard',
    floor_manager: '/floor-manager/dashboard',
    inhouse_sales: '/sales/dashboard',
  };

  const redirectBasedOnRole = (userRole: string) => {
    router.replace(roleRoutes[userRole] || '/login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setError(null);
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        setLoginError('Invalid credentials. Please try again.');
        router.replace('/login');
        return;
      }
      // Fetch current user to get fresh metadata
      const { user: freshUser } = await auth.getCurrentUser();
      const freshRole = freshUser?.user_metadata?.role as string | undefined;
      if (!freshRole) {
        setLoginError('No role assigned. Please contact admin.');
        router.replace('/login');
        return;
      }
      redirectBasedOnRole(freshRole);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
      router.replace('/login');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setError(null);
    
    if (!email || !password || !firstName || !lastName) {
      setLoginError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setLoginError('Password must be at least 6 characters long');
      return;
    }

    try {
      const userData = {
        first_name: firstName,
        last_name: lastName,
        role: role,
        floor: role === 'floor_manager' ? floor : null,
        name: `${firstName} ${lastName}`
      };

      const success = await signUp(email, password, userData);
      if (!success) {
        setLoginError('Sign up failed. Please try again.');
        router.replace('/login');
        return;
      }
      const { user: freshUser } = await auth.getCurrentUser();
      const freshRole2 = freshUser?.user_metadata?.role as string | undefined;
      if (!freshRole2) {
        setLoginError('No role assigned. Please contact admin.');
        router.replace('/login');
        return;
      }
      redirectBasedOnRole(freshRole2);
    } catch (error) {
      console.error('Sign up error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
      router.replace('/login');
    }
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    setError(null);
    try {
      await initialize();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Show loading while auth is initializing
  if (!isInitialized || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600">
              {isSignUp ? 'Sign up for your Sarkar CRM account' : 'Sign in to your Sarkar CRM account'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-6">
            {/* Connection Status */}
            {!isInitialized && (
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Initializing connection...</span>
                </div>
              </div>
            )}
            
            {error && !loginError && (
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-yellow-700">Connection issue detected</span>
                </div>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10 h-12 text-base"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 text-base"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'business_admin' | 'floor_manager' | 'inhouse_sales')}
                      className="w-full px-3 py-3 h-12 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="business_admin">Business Admin</option>
                      <option value="floor_manager">Floor Manager</option>
                      <option value="inhouse_sales">In-house Sales</option>
                    </select>
                  </div>

                  {(role === 'floor_manager' || role === 'business_admin') && (
                    <div className="space-y-2">
                      <label htmlFor="floor" className="text-sm font-medium text-gray-700">
                        {role === 'floor_manager' ? 'Floor Number' : 'Store Number'}
                      </label>
                      <select
                        id="floor"
                        value={floor}
                        onChange={(e) => setFloor(parseInt(e.target.value))}
                        className="w-full px-3 py-3 h-12 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                      >
                        <option value={1}>{role === 'floor_manager' ? 'Floor 1' : 'Store 1'}</option>
                        <option value={2}>{role === 'floor_manager' ? 'Floor 2' : 'Store 2'}</option>
                        <option value={3}>{role === 'floor_manager' ? 'Floor 3' : 'Store 3'}</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    disabled={isLoading}
                    autoComplete={isSignUp ? 'email' : 'username'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 text-base w-full"
                      disabled={isLoading}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex-shrink-0 w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md flex items-center justify-center touch-manipulation transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {(loginError || error) && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-4 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-800">
                        {loginError || error}
                      </p>
                      {error && !loginError && (
                        <div className="mt-2">
                          <button
                            onClick={handleRetryConnection}
                            disabled={isRetrying}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded border border-red-300 disabled:opacity-50 touch-manipulation"
                            style={{ minHeight: '44px' }}
                          >
                            {isRetrying ? 'Retrying...' : 'Retry Connection'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                disabled={isLoading}
                style={{ minHeight: '48px' }}
              >
                {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setLoginError('');
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium touch-manipulation p-2"
                style={{ minHeight: '44px' }}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
              
              <p className="text-xs text-gray-500">
                Need help? Contact your system administrator
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 