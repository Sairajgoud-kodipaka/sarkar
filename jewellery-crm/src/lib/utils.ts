import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the display image URL for a product
 * Returns actual uploaded images from Supabase storage
 */
export function getProductImage(product: any): string | null {
  // Check if product has an uploaded image
  if (product.image && product.image !== 'null' && product.image !== '') {
    return product.image;
  }

  // Check if product has a main image URL
  if (product.main_image_url && product.main_image_url !== 'null' && product.main_image_url !== '') {
    return product.main_image_url;
  }

  // Check if product has a fallback image URL
  if (product.image_url && product.image_url !== 'null' && product.image_url !== '') {
    return product.image_url;
  }

  // Return null if no image is available - no placeholders
  return null;
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

// Removed e-commerce discount functionality for MVP
