'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Floor {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  status: 'active' | 'inactive';
  visitorCount: number;
  salesToday: number;
  lastUpdated: string;
}

interface FloorContextType {
  currentFloor: Floor | null;
  allFloors: Floor[];
  isLoading: boolean;
  error: string | null;
  isFloorManager: boolean;
  isAdmin: boolean;
  getUserFloor: () => Floor | null;
}

const FloorContext = createContext<FloorContextType | undefined>(undefined);

interface FloorProviderProps {
  children: ReactNode;
}

export function FloorProvider({ children }: FloorProviderProps) {
  const { user } = useAuth();
  const [currentFloor, setCurrentFloor] = useState<Floor | null>(null);
  const [allFloors, setAllFloors] = useState<Floor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine user role and permissions
  // Check both user_metadata and the database
  const [userRole, setUserRole] = useState<string>('user');
  const [roleLoading, setRoleLoading] = useState(true);
  
  useEffect(() => {
    const getUserRole = async () => {
      if (!user?.email) {
        setRoleLoading(false);
        return;
      }

      try {
        // First check user_metadata
        const metadataRole = user?.user_metadata?.role;
        if (metadataRole) {
          setUserRole(metadataRole);
          setRoleLoading(false);
          return;
        }

        // If no metadata role, check team_members table
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('role')
          .eq('email', user.email)
          .single();

        if (teamMember?.role) {
          setUserRole(teamMember.role);
        }
      } catch (error) {
        console.error('Error getting user role:', error);
      } finally {
        setRoleLoading(false);
      }
    };

    getUserRole();
  }, [user?.email]);

  const isFloorManager = userRole === 'floor_manager' || userRole === 'manager';
  const isAdmin = userRole === 'admin' || userRole === 'business_admin';

  // Get the floor that the current user manages
  const getUserFloor = (): Floor | null => {
    if (!user || !isFloorManager) return null;
    return currentFloor;
  };

  useEffect(() => {
    const loadFloorData = async () => {
      // Wait for role to be determined
      if (roleLoading) return;
      
      setIsLoading(true);
      setError(null);

      try {
        if (isAdmin) {
          // Admin sees all floors
          const floorsResponse = await apiService.getFloors();
          if (floorsResponse.success) {
            setAllFloors(floorsResponse.data);
            setCurrentFloor(null); // No specific floor for admin
          } else {
            throw new Error('Failed to load floors');
          }
        } else if (isFloorManager) {
          // Floor manager sees only their floor
          if (!user?.email) {
            setError('User email not found');
            return;
          }

          const userFloorResponse = await apiService.getUserFloorByEmail(user.email);
          if (userFloorResponse.success && userFloorResponse.data) {
            setCurrentFloor(userFloorResponse.data);
            setAllFloors([userFloorResponse.data]); // Only their floor
          } else {
            setError('No floor assigned to this manager');
          }
        } else {
          // Regular user sees no floors
          setAllFloors([]);
          setCurrentFloor(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load floor data';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Floor data loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !roleLoading) {
      loadFloorData();
    } else if (!user) {
      setIsLoading(false);
    }
  }, [user, isAdmin, isFloorManager, roleLoading]);

  const value: FloorContextType = {
    currentFloor,
    allFloors,
    isLoading,
    error,
    isFloorManager,
    isAdmin,
    getUserFloor,
  };

  return (
    <FloorContext.Provider value={value}>
      {children}
    </FloorContext.Provider>
  );
}

export function useFloor() {
  const context = useContext(FloorContext);
  if (context === undefined) {
    throw new Error('useFloor must be used within a FloorProvider');
  }
  return context;
}
