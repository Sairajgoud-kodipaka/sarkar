import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the display image URL for a product
 * Only returns actual uploaded images from Supabase, no placeholders
 */
export function getProductImageUrl(product: any): string {
  // Defensive: if a string URL is passed instead of an object, just return it
  if (typeof product === 'string') {
    return product;
  }
  // Only log once per product to avoid spam
  if (!product.image && !product.image_url && !product.main_image_url) {
    // Use a simple flag to avoid repeated logging
    if (product && typeof product === 'object' && !product._loggedNoImage) {
      console.log('🔍 No image found for product:', {
        id: product.id,
        name: product.name,
        category: product.category
      });
      // Guard against readonly/primitive
      try {
        (product as any)._loggedNoImage = true;
      } catch {
        // ignore
      }
    }
  }

  // Check for uploaded image first (current uploads go to image field)
  if (product.image && product.image.startsWith('http')) {
    console.log('✅ Using uploaded image:', product.image);
    return product.image;
  }
  
  // Check for main_image_url (for future compatibility)
  if (product.main_image_url && product.main_image_url.startsWith('http')) {
    console.log('✅ Using main_image_url:', product.main_image_url);
    return product.main_image_url;
  }
  
  // Check for image_url (legacy database structure)
  if (product.image_url && product.image_url.startsWith('http')) {
    console.log('✅ Using image_url:', product.image_url);
    return product.image_url;
  }
  
      // No image found - return empty string (no placeholder)
    return '';
}

/**
 * Get the appropriate emoji for a product category
 */
export function getProductEmoji(product: any): string {
  const category = product.category?.toLowerCase() || product.type?.toLowerCase() || '';
  
  if (category.includes('ring')) {
    return '💍';
  } else if (category.includes('necklace')) {
    return '📿';
  } else if (category.includes('earring')) {
    return '👂';
  } else if (category.includes('crown')) {
    return '👑';
  } else if (category.includes('bangle') || category.includes('bracelet')) {
    return '💫';
  } else if (category.includes('chain')) {
    return '⛓️';
  }
  
  return '💎';
}

/**
 * Format price with Indian Rupee symbol
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get discount percentage
 */
export function getDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (!originalPrice || !discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}
