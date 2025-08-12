/**
 * useMediaQuery Hook
 * 
 * Custom React hook for responsive design that listens to CSS media queries.
 * Provides a clean way to conditionally render components based on screen size.
 * 
 * Key Features:
 * - SSR-safe with proper hydration handling
 * - Automatic cleanup of event listeners
 * - TypeScript support
 * - Performance optimized
 * - Better mobile detection
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to track media query matches
 * 
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean - Whether the media query currently matches
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isLarge = useMediaQuery('(min-width: 1024px)');
 * 
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *   </div>
 * );
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to prevent hydration mismatch
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define the event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener with modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query, mounted]);

  // Return false during SSR and initial render to prevent hydration issues
  return mounted ? matches : false;
}

/**
 * Predefined breakpoint hooks for common use cases
 * These follow modern mobile-first responsive design principles
 */

/**
 * Hook to detect mobile screens (< 768px)
 * Primary mobile breakpoint
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook to detect small mobile screens (< 480px)
 * For very small devices
 */
export function useIsSmallMobile(): boolean {
  return useMediaQuery('(max-width: 479px)');
}

/**
 * Hook to detect medium mobile screens (480px - 767px)
 * For standard mobile devices
 */
export function useIsMediumMobile(): boolean {
  return useMediaQuery('(min-width: 480px) and (max-width: 767px)');
}

/**
 * Hook to detect tablet screens (768px - 1023px)
 * For tablet devices
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook to detect mobile and tablet screens (< 1024px)
 * For all handheld devices
 */
export function useIsMobileOrTablet(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

/**
 * Hook to detect desktop screens (>= 1024px)
 * For desktop and larger devices
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/**
 * Hook to detect large desktop screens (>= 1280px)
 * For large desktop devices
 */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/**
 * Hook to detect extra large screens (>= 1536px)
 * For very large displays
 */
export function useIsExtraLarge(): boolean {
  return useMediaQuery('(min-width: 1536px)');
}

/**
 * Hook to detect if the user prefers reduced motion
 * For accessibility compliance
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect if the user prefers dark mode
 * For theme switching
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook to detect touch devices
 * For touch-specific interactions
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

/**
 * Hook to detect high resolution displays
 * For retina and high-DPI screens
 */
export function useIsHighResolution(): boolean {
  return useMediaQuery('(min-resolution: 2dppx)');
}

/**
 * Hook to detect landscape orientation
 * For orientation-specific layouts
 */
export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}

/**
 * Hook to detect portrait orientation
 * For orientation-specific layouts
 */
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

/**
 * Comprehensive responsive hook that returns current breakpoint
 * Provides detailed breakpoint information
 */
export function useBreakpoint() {
  const isSmallMobile = useIsSmallMobile();
  const isMediumMobile = useIsMediumMobile();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();
  const isExtraLarge = useIsExtraLarge();

  if (isExtraLarge) return '2xl';
  if (isLargeDesktop) return 'xl';
  if (isDesktop) return 'lg';
  if (isTablet) return 'md';
  if (isMediumMobile) return 'sm';
  if (isSmallMobile) return 'xs';
  
  return 'unknown';
}

/**
 * Type for breakpoint values
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'unknown';