'use client';

import React, { useEffect, useState } from 'react';
import { ToastNotification } from './ToastNotification';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';
import { useRouter } from 'next/navigation';

interface NotificationManagerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxToasts = 3,
  position = 'top-right'
}) => {
  const router = useRouter();
  const { state, actions } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  // Don't show notifications if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Disable toast notifications - only show in bell dropdown
  return null;

  // Filter notifications based on user role and store access
  const getScopedNotifications = (notifications: Notification[]) => {
    if (!user) return [];

    // Business admin can see all notifications
    if (user.role === 'business_admin') {
      return notifications;
    }

    // Store manager and sales team can only see their store's notifications
    if (user.role === 'store_manager' || user.role === 'sales_team') {
      const tenantId = (user as any)?.tenantId ?? (user as any)?.tenant?.id ?? (user as any)?.tenant;
      const storeId = (user as any)?.storeId ?? (user as any)?.store?.id ?? (user as any)?.store;
      return notifications.filter(notification => 
        (tenantId ? notification.tenantId === String(tenantId) : true) &&
        (!notification.storeId || (storeId ? notification.storeId === String(storeId) : true))
      );
    }

    // Telecaller can only see their assigned notifications
    if (user.role === 'telecaller') {
      return notifications.filter(notification => 
        notification.userId === user.id.toString() ||
        notification.tenantId === String((user as any)?.tenantId ?? (user as any)?.tenant)
      );
    }

    // Marketing team can see marketing-related notifications
    if (user.role === 'marketing_team') {
      return notifications.filter(notification => 
        notification.type === 'marketing_campaign' ||
        notification.type === 'announcement'
      );
    }

    // Default: only show user's own notifications
    return notifications.filter(notification => 
      notification.userId === user.id.toString()
    );
  };

  // Handle new notifications and show them as toasts
  useEffect(() => {
    // Get scoped notifications that are unread and not already in active toasts
    const scopedNotifications = getScopedNotifications(state.notifications);
    const newNotifications = scopedNotifications.filter(
      notification => 
        notification.status === 'unread' && 
        !activeToasts.find(toast => toast.id === notification.id)
    );

    if (newNotifications.length > 0) {
      // Add new notifications to active toasts
      setActiveToasts(prev => {
        const updated = [...prev, ...newNotifications];
        // Keep only the latest notifications up to maxToasts
        return updated.slice(-maxToasts);
      });
    }
  }, [state.notifications, maxToasts, user]);

  // Remove notifications from active toasts if they're no longer unread
  useEffect(() => {
    const scopedNotifications = getScopedNotifications(state.notifications);
    setActiveToasts(prev => 
      prev.filter(toast => {
        const currentNotification = scopedNotifications.find(n => n.id === toast.id);
        return currentNotification && currentNotification.status === 'unread';
      })
    );
  }, [state.notifications, user]);

  // Clear active toasts when component unmounts or when notifications are refreshed
  useEffect(() => {
    return () => {
      setActiveToasts([]);
    };
  }, []);

  // Add keyboard shortcut to dismiss all notifications (Escape key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeToasts.length > 0) {
        dismissAllToasts();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeToasts.length]);

  const handleToastClose = async (notificationId: string) => {
    // Remove from active toasts immediately
    setActiveToasts(prev => prev.filter(toast => toast.id !== notificationId));
    
    // Mark as read in the global state
    try {
      await actions.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleToastAction = async (notification: Notification) => {
    // Mark as read first
    try {
      await actions.markAsRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    // Remove from active toasts
    setActiveToasts(prev => prev.filter(toast => toast.id !== notification.id));
    
    // Navigate to action URL if available using Next.js router
    if (notification.actionUrl) {
      try {
        // Use Next.js router for client-side navigation
        router.push(notification.actionUrl);
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to window.location if router fails
        window.location.href = notification.actionUrl;
      }
    }
  };

  // Function to dismiss all active toasts
  const dismissAllToasts = () => {
    setActiveToasts([]);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {/* Dismiss all button - only show when there are multiple notifications */}
      {activeToasts.length > 1 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={dismissAllToasts}
            className="text-xs text-gray-500 hover:text-gray-700 bg-white px-2 py-1 rounded border shadow-sm"
            title="Dismiss all notifications (or press Escape)"
          >
            Dismiss All
          </button>
        </div>
      )}
      
      {activeToasts.map((notification, index) => (
        <div
          key={notification.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * 20}px)`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            notification={notification}
            onClose={() => handleToastClose(notification.id)}
            onAction={() => handleToastAction(notification)}
            duration={notification.isPersistent ? undefined : 5000}
          />
        </div>
      ))}
    </div>
  );
}; 