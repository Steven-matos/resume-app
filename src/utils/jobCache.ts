import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job, JobSearchParams } from '../types/job';

/**
 * Cache configuration for job data
 */
const CACHE_CONFIG = {
  // Cache duration in milliseconds (24 hours)
  CACHE_DURATION: 24 * 60 * 60 * 1000,
  
  // Maximum cache size (50 searches)
  MAX_CACHE_SIZE: 50,
  
  // Cache keys
  CACHE_PREFIX: 'job_cache_',
  REQUEST_COUNT_KEY: 'api_request_count',
  LAST_REQUEST_DATE: 'last_request_date',
  
  // Request limits
  MAX_REQUESTS_PER_MONTH: 200,
  REQUEST_RESET_DAY: 1, // 1st of each month
};

/**
 * Cache entry interface
 */
interface CacheEntry {
  data: Job[];
  timestamp: number;
  searchParams: JobSearchParams;
  totalResults: number;
}

/**
 * Request tracking interface
 */
interface RequestTracker {
  count: number;
  lastReset: string; // YYYY-MM format
}

/**
 * Smart job caching system to optimize API usage
 */
class JobCache {
  /**
   * Generate cache key from search parameters
   */
  private generateCacheKey(params: JobSearchParams): string {
    const key = `${params.query}_${params.location || 'any'}_${params.jobType || 'any'}_${params.experienceLevel || 'any'}`;
    return CACHE_CONFIG.CACHE_PREFIX + key.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Get cached job data if available and not expired
   */
  async getCachedJobs(params: JobSearchParams): Promise<Job[] | null> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const entry: CacheEntry = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - entry.timestamp < CACHE_CONFIG.CACHE_DURATION) {
        console.log('Using cached job data for:', params.query);
        return entry.data;
      }
      
      // Cache expired, remove it
      await AsyncStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache job data with timestamp
   */
  async cacheJobs(params: JobSearchParams, jobs: Job[], totalResults: number): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const entry: CacheEntry = {
        data: jobs,
        timestamp: Date.now(),
        searchParams: params,
        totalResults,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log('Cached job data for:', params.query);
      
      // Clean up old cache entries if needed
      await this.cleanupCache();
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  /**
   * Clean up old cache entries to prevent storage overflow
   */
  private async cleanupCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.CACHE_PREFIX));
      
      if (cacheKeys.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
        // Get cache entries with timestamps
        const entries = await Promise.all(
          cacheKeys.map(async (key) => {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              const entry: CacheEntry = JSON.parse(data);
              return { key, timestamp: entry.timestamp };
            }
            return null;
          })
        );
        
        // Sort by timestamp (oldest first) and remove oldest entries
        const validEntries = entries.filter(entry => entry !== null);
        validEntries.sort((a, b) => a!.timestamp - b!.timestamp);
        
        const toRemove = validEntries.slice(0, validEntries.length - CACHE_CONFIG.MAX_CACHE_SIZE);
        await Promise.all(toRemove.map(entry => AsyncStorage.removeItem(entry!.key)));
        
        console.log('Cleaned up', toRemove.length, 'old cache entries');
      }
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Track API request count (admin-level tracking)
   */
  async trackRequest(): Promise<{ canMakeRequest: boolean; remainingRequests: number }> {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const trackerData = await AsyncStorage.getItem(CACHE_CONFIG.REQUEST_COUNT_KEY);
      let tracker: RequestTracker = trackerData ? JSON.parse(trackerData) : { count: 0, lastReset: currentMonth };
      
      // Reset counter if it's a new month
      if (tracker.lastReset !== currentMonth) {
        tracker = { count: 0, lastReset: currentMonth };
      }
      
      const remainingRequests = CACHE_CONFIG.MAX_REQUESTS_PER_MONTH - tracker.count;
      const canMakeRequest = remainingRequests > 0;
      
      if (canMakeRequest) {
        tracker.count++;
        await AsyncStorage.setItem(CACHE_CONFIG.REQUEST_COUNT_KEY, JSON.stringify(tracker));
        
        // Log for admin monitoring (not user-facing)
        console.log(`[ADMIN] API Request made. ${remainingRequests - 1} requests remaining this month.`);
      } else {
        console.warn(`[ADMIN] API request limit reached. Using cached/mock data.`);
      }
      
      return { canMakeRequest, remainingRequests };
    } catch (error) {
      console.warn('Request tracking error:', error);
      return { canMakeRequest: true, remainingRequests: 999 }; // Fallback
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStats(): Promise<{ used: number; remaining: number; resetDate: string }> {
    try {
      const trackerData = await AsyncStorage.getItem(CACHE_CONFIG.REQUEST_COUNT_KEY);
      const tracker: RequestTracker = trackerData ? JSON.parse(trackerData) : { count: 0, lastReset: '' };
      
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, CACHE_CONFIG.REQUEST_RESET_DAY);
      
      return {
        used: tracker.count,
        remaining: Math.max(0, CACHE_CONFIG.MAX_REQUESTS_PER_MONTH - tracker.count),
        resetDate: nextMonth.toISOString().split('T')[0],
      };
    } catch (error) {
      console.warn('Request stats error:', error);
      return { used: 0, remaining: CACHE_CONFIG.MAX_REQUESTS_PER_MONTH, resetDate: '' };
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.CACHE_PREFIX));
      await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
      console.log('Cleared all cached job data');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ totalEntries: number; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return {
        totalEntries: cacheKeys.length,
        totalSize: totalSize,
      };
    } catch (error) {
      console.warn('Cache stats error:', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }
}

export const jobCache = new JobCache(); 