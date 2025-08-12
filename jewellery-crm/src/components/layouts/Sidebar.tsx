/**
 * Sidebar Navigation Component
 * 
 * This component provides the main navigation sidebar with HubSpot-inspired design.
 * Features include role-based navigation, collapsible sections, and active state management.
 * 
 * Key Features:
 * - Dark navy background matching HubSpot design
 * - Role-based menu items
 * - Active state highlighting with orange accent
 * - Responsive behavior for mobile devices
 * - Smooth animations and interactions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home,
  Package,
  Users,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Gem,
  Building,
  BarChart3,
  TrendingUp,
  Calendar,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

// Navigation items based on user role
const getNavigationItems = (userRole?: string): NavItem[] => {

  // Business Admin navigation
  if (userRole === 'business_admin') {
    return [
      {
        title: 'Dashboard',
        href: '/business-admin/dashboard',
        icon: Home,
      },
      {
        title: 'Customers',
        href: '/business-admin/customers',
        icon: Users,
      },
      {
        title: 'Products',
        href: '/business-admin/products',
        icon: Package,
      },
      {
        title: 'Orders',
        href: '/business-admin/orders',
        icon: ShoppingBag,
      },
      {
        title: 'Appointments',
        href: '/business-admin/appointments',
        icon: Calendar,
      },
      {
        title: 'Inventory',
        href: '/business-admin/inventory',
        icon: Package,
      },
      {
        title: 'Support',
        href: '/business-admin/support',
        icon: MessageSquare,
      },
      {
        title: 'Settings',
        href: '/business-admin/settings',
        icon: Settings,
      },
    ];
  }

  // Floor Manager navigation
  if (userRole === 'floor_manager') {
    return [
      {
        title: 'Dashboard',
        href: '/floor-manager/dashboard',
        icon: Home,
      },
      {
        title: 'Customers',
        href: '/floor-manager/customers',
        icon: Users,
      },
      {
        title: 'Appointments',
        href: '/floor-manager/appointments',
        icon: Calendar,
      },
      {
        title: 'Orders',
        href: '/floor-manager/orders',
        icon: ShoppingBag,
      },
      {
        title: 'Products',
        href: '/floor-manager/products',
        icon: Package,
      },
      {
        title: 'Support',
        href: '/floor-manager/support',
        icon: MessageSquare,
      },
    ];
  }

  // In-house Sales & Sales Associate navigation
  if (userRole === 'inhouse_sales' || userRole === 'sales_associate') {
    return [
      {
        title: 'Dashboard',
        href: '/sales/dashboard',
        icon: Home,
      },
      {
        title: 'Customers',
        href: '/sales/customers',
        icon: Users,
      },
      {
        title: 'Pipeline',
        href: '/sales/pipeline',
        icon: TrendingUp,
      },
      {
        title: 'Appointments',
        href: '/sales/appointments',
        icon: Calendar,
      },
      {
        title: 'Orders',
        href: '/sales/orders',
        icon: ShoppingBag,
      },
      {
        title: 'Products',
        href: '/sales/products',
        icon: Package,
      },
      {
        title: 'Profile',
        href: '/sales/profile',
        icon: User,
      },
      {
        title: 'Support',
        href: '/sales/support',
        icon: MessageSquare,
      },
    ];
  }

  // Default navigation (fallback)
  return [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
  ];
};

export function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Debug logging
  console.log('Sidebar - isMobile:', isMobile, 'isOpen:', isOpen, 'onClose:', !!onClose);

  // Avoid noisy console logs in production that can slow down the app

  // If no user, don't render sidebar
  if (!user) {
    console.log('Sidebar - No user, returning null');
    return null;
  }

  // Get user role from metadata
  const userRole = user?.user_metadata?.role || 'user';
  const navigationItems = getNavigationItems(userRole);

  // Check if the current route matches a nav item
  const isActiveRoute = (href: string): boolean => {
    return pathname.startsWith(href);
  };

  // Navigation Item Component
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = isActiveRoute(item.href);

    const itemClasses = cn(
      'flex items-center w-full px-3 py-4 text-sm font-medium rounded-lg transition-all duration-200 sidebar-item-hover',
      'hover:bg-sidebar-accent',
      isActive && 'bg-primary text-primary-foreground shadow-sm',
      !isActive && 'text-sidebar-foreground',
      isMobile && 'py-4 text-base' // Larger touch targets on mobile
    );

    return (
      <Link href={item.href} onClick={onClose} className="group">
        <div className={itemClasses}>
          <item.icon className={cn(
            "mr-3 flex-shrink-0",
            isMobile ? "h-6 w-6" : "h-5 w-5" // Larger icons on mobile
          )} />
          <span className="truncate group-hover:text-white">{item.title}</span>
        </div>
      </Link>
    );
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'business_admin':
        return 'BUSINESS ADMIN';
      case 'floor_manager':
        return 'FLOOR MANAGER';
      case 'inhouse_sales':
        return 'IN-HOUSE SALES';
      default:
        return 'USER';
    }
  };

  // Don't render sidebar on mobile if it's not open
  if (isMobile && !isOpen) {
    console.log('Sidebar - Mobile and not open, returning null');
    return null;
  }

  return (
    <div
      id="app-sidebar"
      data-open={isOpen}
      className={cn(
        'bg-sidebar text-sidebar-foreground h-screen overflow-y-auto flex flex-col',
        'fixed left-0 top-0 z-30', // Ensure proper positioning and z-index
        !isOpen && 'transform -translate-x-full lg:translate-x-0',
        isMobile ? 'w-full max-w-sm' : 'w-60', // Full width on mobile, fixed width on desktop
        'border-r border-sidebar-border', // Add right border for better definition
        isMobile && isOpen && 'z-50', // Higher z-index on mobile when open
        className
      )}
    >
      {/* Logo and Business Name */}
      <div className={cn(
        "flex items-center justify-between px-4 py-6 border-b border-sidebar-border",
        isMobile && "px-6 py-8" // More padding on mobile
      )}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <Gem className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "font-semibold text-white",
              isMobile ? "text-xl" : "text-lg" // Larger text on mobile
            )}>
              CRM Dashboard
            </span>
            <span className="text-xs text-white/80">
              {getRoleDisplayName(userRole)}
            </span>
          </div>
        </div>
        
        {/* Close button for mobile */}
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-sidebar-accent p-2 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 px-4 py-4 space-y-2",
        isMobile && "px-6 py-6 space-y-3" // More spacing on mobile
      )}>
        {navigationItems.map((item) => (
          <div key={item.href} className="sidebar-nav-item">
            <NavItemComponent item={item} />
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className={cn(
        "p-4 border-t border-sidebar-border bg-sidebar/50",
        isMobile && "p-6" // More padding on mobile
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-3 py-3 h-auto text-white hover:bg-sidebar-accent rounded-lg transition-colors duration-200",
                isMobile && "py-4 px-4" // Larger touch target on mobile
              )}
            >
              <Avatar className="w-8 h-8 mr-3">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className={cn(
                  "font-medium truncate max-w-[120px] text-white",
                  isMobile ? "text-base" : "text-sm" // Larger text on mobile
                )}>
                  {user.email || 'User'}
                </span>
                <span className="text-xs text-white/80 capitalize">
                  {userRole === 'business_admin' ? 'Business Admin' : 
                   userRole === 'floor_manager' ? 'Floor Manager' : 
                   userRole === 'inhouse_sales' ? 'In-house Sales' : 'User'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-card border-border shadow-xl"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="text-destructive" onClick={async () => {
              await logout();
              router.push('/login');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}