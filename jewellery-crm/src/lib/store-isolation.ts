import { useAuth } from '@/hooks/useAuth';

/**
 * Store Isolation Service
 * Handles store-based data filtering and access control
 */

export interface StoreIsolationConfig {
  currentStoreId: string | null;
  userRole: string;
  canAccessAllStores: boolean;
  canAccessCurrentStore: boolean;
  storeFilter: Record<string, any>;
}

export interface StoreData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  status: 'active' | 'inactive' | 'maintenance';
  is_active: boolean;
}

/**
 * Hook to get store isolation configuration for the current user
 */
export const useStoreIsolation = (): StoreIsolationConfig => {
  const { user } = useAuth();
  
  if (!user) {
    return {
      currentStoreId: null,
      userRole: 'none',
      canAccessAllStores: false,
      canAccessCurrentStore: false,
      storeFilter: {}
    };
  }

  const userRole = user.role;
  const currentStoreId = (user as any)?.storeId || (user as any)?.store;
  
  // Determine access levels based on role
  const canAccessAllStores = userRole ? ['business_admin'].includes(userRole) : false;
  const canAccessCurrentStore = currentStoreId || canAccessAllStores;
  
  // Create store filter for API calls
  const storeFilter = canAccessAllStores ? {} : { store_id: currentStoreId };

  return {
    currentStoreId,
    userRole: userRole || 'unknown',
    canAccessAllStores,
    canAccessCurrentStore,
    storeFilter
  };
};

/**
 * Utility to filter data by store
 */
export const filterDataByStore = <T extends Record<string, any>>(
  data: T[],
  storeId: string | null,
  options?: {
    storeField?: string;
    allowAllStores?: boolean;
  }
): T[] => {
  if (!storeId || options?.allowAllStores) {
    return data;
  }

  const storeField = options?.storeField || 'store_id';
  return data.filter(item => item[storeField] === storeId);
};

/**
 * Utility to get API query parameters for store filtering
 */
export const getStoreQueryParams = (
  storeId: string | null,
  allowAllStores: boolean = false
): Record<string, string> => {
  if (allowAllStores || !storeId) {
    return {};
  }

  return { store_id: storeId };
};

/**
 * Utility to check if user can access specific store data
 */
export const canAccessStoreData = (
  itemStoreId: string | null,
  userStoreId: string | null,
  userRole: string
): boolean => {
      // Business admins can access all stores
    if (['business_admin'].includes(userRole)) {
    return true;
  }

  // Store managers and sales can only access their assigned store
  if (userStoreId && itemStoreId) {
    return userStoreId === itemStoreId;
  }

  return false;
};

/**
 * Utility to get store display information
 */
export const getStoreDisplayInfo = (
  storeId: string | null,
  stores: StoreData[]
): { name: string; isCurrentStore: boolean } => {
  if (!storeId) {
    return { name: 'All Stores', isCurrentStore: false };
  }

  const store = stores.find(s => s.id === storeId);
  return {
    name: store?.name || `Store ${storeId}`,
    isCurrentStore: true
  };
};

/**
 * Utility to validate store access for CRUD operations
 */
export const validateStoreAccess = (
  action: 'create' | 'read' | 'update' | 'delete',
  targetStoreId: string | null,
  userStoreId: string | null,
  userRole: string
): { allowed: boolean; reason?: string } => {
      // Business admins can perform all actions on all stores
    if (['business_admin'].includes(userRole)) {
    return { allowed: true };
  }

  // Store managers and sales can only perform actions on their assigned store
  if (userStoreId && targetStoreId) {
    if (userStoreId === targetStoreId) {
      return { allowed: true };
    } else {
      return { 
        allowed: false, 
        reason: 'You can only perform this action on your assigned store' 
      };
    }
  }

  // Users without store assignment cannot perform store-specific actions
  if (!userStoreId && targetStoreId) {
    return { 
      allowed: false, 
      reason: 'You are not assigned to any store' 
    };
  }

  return { allowed: true };
};

/**
 * Utility to get store-specific API endpoints
 */
export const getStoreSpecificEndpoint = (
  baseEndpoint: string,
  storeId: string | null,
  allowAllStores: boolean = false
): string => {
  if (allowAllStores || !storeId) {
    return baseEndpoint;
  }

  return `${baseEndpoint}?store_id=${storeId}`;
};

/**
 * Utility to create store-aware form data
 */
export const createStoreAwareFormData = <T extends Record<string, any>>(
  formData: T,
  storeId: string | null,
  userRole: string
): T & { store_id?: string } => {
      // Business admins can choose store
    if (['business_admin'].includes(userRole)) {
    return formData;
  }

  // Store managers and sales are automatically assigned to their store
  if (storeId) {
    return { ...formData, store_id: storeId };
  }

  return formData;
};

/**
 * Utility to get store selection options for forms
 */
export const getStoreSelectionOptions = (
  stores: StoreData[],
  userStoreId: string | null,
  userRole: string
): Array<{ value: string; label: string; disabled?: boolean }> => {
  if (['platform_admin', 'business_admin'].includes(userRole)) {
    // Admins can select any store
    return stores.map(store => ({
      value: store.id,
      label: store.name,
      disabled: !store.is_active
    }));
  }

  // Store managers and sales can only see their assigned store
  if (userStoreId) {
    const userStore = stores.find(s => s.id === userStoreId);
    if (userStore) {
      return [{
        value: userStore.id,
        label: userStore.name,
        disabled: false
      }];
    }
  }

  return [];
};

/**
 * Utility to check if data belongs to current user's store
 */
export const isDataFromCurrentStore = (
  item: Record<string, any>,
  userStoreId: string | null,
  userRole: string
): boolean => {
  if (['platform_admin', 'business_admin'].includes(userRole)) {
    return true; // Admins can see all data
  }

  if (!userStoreId) {
    return false; // User not assigned to any store
  }

  const itemStoreId = item.store_id || item.store;
  return itemStoreId === userStoreId;
};

/**
 * Utility to get store context for API calls
 */
export const getStoreContext = (
  storeId: string | null,
  userRole: string
): Record<string, any> => {
  return {
    store_id: storeId,
    user_role: userRole,
    timestamp: new Date().toISOString()
  };
};

/**
 * Utility to log store access attempts
 */
export const logStoreAccess = (
  action: string,
  targetStoreId: string | null,
  userStoreId: string | null,
  userRole: string,
  success: boolean
): void => {
  console.log('Store Access Log:', {
    action,
    targetStoreId,
    userStoreId,
    userRole,
    success,
    timestamp: new Date().toISOString()
  });
};

/**
 * Utility to get store statistics
 */
export const getStoreStatistics = (
  data: Record<string, any>[],
  storeId: string | null,
  userRole: string
): Record<string, number> => {
  if (['business_admin'].includes(userRole)) {
    // Admins see all data
    return {
      total: data.length,
      active: data.filter(item => item.status === 'active').length,
      inactive: data.filter(item => item.status === 'inactive').length
    };
  }

  // Store managers and sales see only their store data
  if (storeId) {
    const storeData = data.filter(item => 
      (item.store_id || item.store) === storeId
    );
    
    return {
      total: storeData.length,
      active: storeData.filter(item => item.status === 'active').length,
      inactive: storeData.filter(item => item.status === 'inactive').length
    };
  }

  return { total: 0, active: 0, inactive: 0 };
};
