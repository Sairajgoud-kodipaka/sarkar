/**
 * Header Component
 * 
 * Top navigation bar with search, notifications, and user menu.
 * Features HubSpot-inspired design with clean white background.
 * 
 * Key Features:
 * - Global search functionality
 * - Notification center
 * - Quick actions menu
 * - User profile dropdown
 * - Mobile-responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Search,
  Menu,
  MessageSquare,
  Calendar,
  Users,
  Package,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications';
import { useTheme } from '@/components/providers/ThemeProvider';

interface HeaderProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  className?: string;
}

/**
 * Header Component
 * 
 * Renders the top navigation bar with search, actions, and user menu.
 */
export function Header({ 
  onSidebarToggle, 
  showSidebarToggle = false, 
  className 
}: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  /**
   * Handle search submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSidebarToggle = () => {
    if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  return (
    <header className={cn(
      'sticky top-0 z-20 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'border-b border-border',
      'relative', // Ensure proper positioning context
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile Sidebar Toggle */}
          {showSidebarToggle && (
            <Button
              id="sidebar-toggle"
              variant="ghost"
              size="icon"
              onClick={handleSidebarToggle}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors duration-200 touch-manipulation"
              aria-label="Toggle sidebar navigation"
              aria-expanded={false}
              aria-controls="app-sidebar"
            >
              <Menu className="h-5 w-5 text-foreground" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}

          {/* Mobile Debug Info */}
          {showSidebarToggle && (
            <div className="lg:hidden text-xs text-muted-foreground font-mono">
              Mobile: {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <div className={cn(
              'relative flex items-center',
              'w-64 lg:w-80 xl:w-96',
              isSearchFocused && 'z-50'
            )}>
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers, products, orders..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  'pl-10 pr-4 py-2 w-full',
                  'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'transition-all duration-200',
                  'touch-manipulation' // Optimize for touch
                )}
                aria-label="Search"
              />
            </div>

            {/* Search Suggestions (when focused) */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quick Actions
                  </div>
                  <div className="space-y-1">
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm">
                      Search for &ldquo;{searchQuery}&rdquo; in customers
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm">
                      Search for &ldquo;{searchQuery}&rdquo; in products
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm">
                      Search for &ldquo;{searchQuery}&rdquo; in orders
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Notifications */}
          <NotificationBell />

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 p-2 touch-manipulation"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9 p-2 touch-manipulation"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Help Center
              </DropdownMenuItem>
              <DropdownMenuItem>
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem>
                Contact Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Report a Bug
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 w-9 rounded-full p-0 touch-manipulation"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {(() => {
                      const fn = (user as any)?.first_name || (user as any)?.firstName || '';
                      const ln = (user as any)?.last_name || (user as any)?.lastName || '';
                      const display = `${fn} ${ln}`.trim() || (user as any)?.email || 'U';
                      return display.split(' ').map((n: string) => n[0]).join('');
                    })()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {((user as any)?.first_name || (user as any)?.firstName || '') + ' ' + ((user as any)?.last_name || (user as any)?.lastName || '')}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Business Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}