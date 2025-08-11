/**
 * useAuth Hook
 * 
 * Authentication hook with Supabase Auth and role-based access.
 * 
 * Key Features:
 * - User state management with Supabase
 * - Role-based access
 * - Local storage persistence
 * - Multiple user roles support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useEffect } from 'react';

interface AuthState {
  user: User | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
  isInitialized: boolean;
  _authSubscription?: any; // For cleanup of auth state change listener
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  cleanup: () => void;
}

export const useAuth = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,
      isInitialized: false,

      initialize: async () => {
        // Prevent multiple initializations
        if (get().isInitialized) return;

        const maxRetries = 2;
        let retryCount = 0;

        const attemptInitialization = async (): Promise<void> => {
          try {
            set({ isLoading: true });
            
            // Increase timeout to 10 seconds to prevent premature timeouts
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Auth initialization timeout - check network connection')), 10000);
            });
            
            const initPromise = (async () => {
              try {
                // Get current session with better error handling
                const { session, error } = await auth.getSession();
                
                if (error) {
                  set({ 
                    isLoading: false, 
                    isHydrated: true,
                    isInitialized: true,
                    error: error.message 
                  });
                  return;
                }

                if (session?.user) {
                  set({
                    user: session.user,
                    session,
                    isAuthenticated: true,
                    isLoading: false,
                    isHydrated: true,
                    isInitialized: true,
                    error: null,
                  });
                } else {
                  set({ 
                    isLoading: false, 
                    isHydrated: true,
                    isInitialized: true,
                    user: null,
                    session: null,
                    isAuthenticated: false 
                  });
                }
                // Set up auth state change listener (only once)
                const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
                  if (event === 'SIGNED_IN' && session?.user) {
                    set({
                      user: session.user,
                      session,
                      isAuthenticated: true,
                      error: null,
                    });
                  } else if (event === 'SIGNED_OUT') {
                    set({
                      user: null,
                      session: null,
                      isAuthenticated: false,
                      error: null,
                    });
                  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    set({
                      user: session.user,
                      session,
                      isAuthenticated: true,
                      error: null,
                    });
                  }
                });

                // Store subscription for cleanup
                set({ 
                  // @ts-ignore - storing subscription for cleanup
                  _authSubscription: subscription 
                });

              } catch (sessionError) {
                throw sessionError; // Re-throw to trigger retry
              }
            })();
            
            // Race between timeout and initialization
            await Promise.race([initPromise, timeoutPromise]);

          } catch (error) {
            
            if (retryCount < maxRetries) {
              retryCount++;
              // Wait 2 seconds before retry (increased from 1 second)
              await new Promise(resolve => setTimeout(resolve, 2000));
              return attemptInitialization();
            } else {
              // Max retries reached, set as not authenticated
              const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
              set({ 
                isLoading: false, 
                isHydrated: true,
                isInitialized: true,
                user: null,
                session: null,
                isAuthenticated: false,
                error: `Initialization failed after ${maxRetries + 1} attempts: ${errorMessage}`
              });
            }
          }
        };

        await attemptInitialization();
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await auth.signIn(email, password);
          
          if (error) {
            set({
              isLoading: false,
              error: error.message,
            });
            return false;
          }

          if (data.user && data.session) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: 'Login failed - no user data received',
            });
            return false;
          }
        } catch (error: any) {
          
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          return false;
        }
      },

      signUp: async (email: string, password: string, userData: any) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await auth.signUp(email, password, userData);
          
          if (error) {
            set({
              isLoading: false,
              error: error.message,
            });
            return false;
          }

          if (data.user) {
            set({
              user: data.user,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: 'Sign up failed - no user data received',
            });
            return false;
          }
        } catch (error: any) {
          
          set({
            isLoading: false,
            error: error.message || 'Sign up failed',
          });
          return false;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          // Clean up auth subscription
          const state = get();
          if (state._authSubscription) {
            // @ts-ignore
            state._authSubscription.unsubscribe();
          }
          
          const { error } = await auth.signOut();
          
          if (error) {}
        } catch (error) {
          
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            isInitialized: false,
          });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setSession: (session: any) => {
        set({ session });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      cleanup: () => {
        // Clean up auth subscription
        const state = get();
        if (state._authSubscription) {
          // @ts-ignore
          state._authSubscription.unsubscribe();
        }
        set({ 
          _authSubscription: undefined,
          isInitialized: false 
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);

// Custom hook to manage auth initialization lifecycle
export const useAuthInitialization = () => {
  const { initialize, isInitialized, isLoading, isHydrated } = useAuth();

  useEffect(() => {
    if (!isInitialized && !isLoading && isHydrated) {
      initialize();
    }
  }, [isInitialized, isLoading, isHydrated, initialize]);

  return { isInitialized, isLoading, isHydrated };
};