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

interface AuthState {
  user: User | null;
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;
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

      initialize: async () => {
        try {
          set({ isLoading: true });
          const { session, error } = await auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            set({ isLoading: false });
            return;
          }

          if (session?.user) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Initialize error:', error);
          set({ isLoading: false });
        }
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
          console.error('Login error:', error);
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
          console.error('Sign up error:', error);
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
          const { error } = await auth.signOut();
          
          if (error) {
            console.error('Logout error:', error);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
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