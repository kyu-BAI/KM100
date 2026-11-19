/**
 * System Cache Service for PETC Inventory & Scanned Receipt Records
 * Provides instantaneous Stale-While-Revalidate loading on page refresh/reload,
 * eliminating all startup lag and loading screens.
 */

const CACHE_KEY = 'petc_inventory_items_cache_v1';
const CACHE_TIME_KEY = 'petc_inventory_items_cache_time';

/**
 * Load cached items synchronously on application startup
 * @returns {Array} Cached items list or empty array
 */
export function loadCachedItems() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[CacheService] Error reading items cache:', err);
  }
  return [];
}

/**
 * Persists current items list to client-side localStorage cache with quota protection
 * @param {Array} items 
 */
export function saveCachedItems(items) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!Array.isArray(items) || items.length === 0) return;

  try {
    // 1. Try standard serialization
    const serialized = JSON.stringify(items);
    localStorage.setItem(CACHE_KEY, serialized);
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch (err) {
    console.warn('[CacheService] Storage quota reached, saving compact cache without heavy base64 images...');
    try {
      // 2. Fallback: Strip huge base64 images (>25KB) from filePath & previewData to prevent quota overflow
      const compactItems = items.map(item => {
        const copy = { ...item };
        if (copy.filePath && copy.filePath.length > 25000) {
          copy.filePath = ''; // preserved in Supabase DB, stripped from local cache
        }
        if (copy.previewData && copy.previewData.image && copy.previewData.image.length > 25000) {
          copy.previewData = { ...copy.previewData, image: '' };
        }
        return copy;
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify(compactItems));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (innerErr) {
      console.warn('[CacheService] Fallback to minimal metadata cache:', innerErr);
      try {
        // 3. Absolute minimal metadata fallback
        const minimalItems = items.map(({ filePath, previewData, ...rest }) => rest);
        localStorage.setItem(CACHE_KEY, JSON.stringify(minimalItems));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } catch (finalErr) {
        console.error('[CacheService] Failed to cache items:', finalErr);
      }
    }
  }
}

/**
 * Returns human-readable relative string of when the cache was last synchronized
 */
export function getCacheSyncTime() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const timeStr = localStorage.getItem(CACHE_TIME_KEY);
    if (!timeStr) return null;
    const time = parseInt(timeStr, 10);
    if (isNaN(time)) return null;

    const diffSec = Math.floor((Date.now() - time) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  } catch {
    return null;
  }
}

/**
 * Clears the cache (used upon logout or manual hard reset)
 */
export function clearCachedItems() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
  } catch (err) {
    console.warn('[CacheService] Error clearing cache:', err);
  }
}
