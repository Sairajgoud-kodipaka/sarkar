'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, Building2, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, isLoading, error, user, setError, initialize } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'platform_admin' | 'business_admin' | 'floor_manager' | 'inhouse_sales'>('inhouse_sales');
  const [floor, setFloor] = useState(1);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Initialize auth state
    initialize();
  }, [initialize]);

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    if (user) {
      const userRole = user.user_metadata?.role || 'floor_manager';
      redirectBasedOnRole(userRole);
    }
  }, [user]);

  const redirectBasedOnRole = (userRole: string) => {
    switch (userRole) {
      case 'platform_admin':
        router.push('/platform/dashboard');
        break;
      case 'business_admin':
        router.push('/business-admin/dashboard');
        break;
      case 'floor_manager':
        router.push('/floor-manager/dashboard');
        break;
      case 'inhouse_sales':
        router.push('/sales/dashboard');
        break;
      default:
        // Default to sales dashboard for unknown roles
        router.push('/sales/dashboard');
    }
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
      
      if (success && user) {
        const userRole = user.user_metadata?.role || 'floor_manager';
        redirectBasedOnRole(userRole);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
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
      
      if (success && user) {
        const userRole = user.user_metadata?.role || 'floor_manager';
        redirectBasedOnRole(userRole);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSignUp ? 'Sign up for your Sarkar CRM account' : 'Sign in to your Sarkar CRM account'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Auth Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
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
                          className="pl-10"
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
                      onChange={(e) => setRole(e.target.value as 'platform_admin' | 'business_admin' | 'floor_manager' | 'inhouse_sales')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="platform_admin">Platform Admin</option>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {loginError || error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setLoginError('');
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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