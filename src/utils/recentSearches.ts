import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Recent search item interface
 */
export interface RecentSearch {
  query: string;
  location?: string;
  timestamp: number;
}

/**
 * Configuration for recent searches
 */
const RECENT_SEARCHES_CONFIG = {
  STORAGE_KEY: 'recent_searches',
  MAX_SEARCHES: 10, // Maximum number of recent searches to keep
};

/**
 * Recent searches manager
 * Handles storing, retrieving, and managing user's recent job searches
 */
class RecentSearchesManager {
  /**
   * Get all recent searches, sorted by most recent first
   */
  async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_CONFIG.STORAGE_KEY);
      if (!stored) return [];
      
      const searches: RecentSearch[] = JSON.parse(stored);
      
      // Sort by timestamp (most recent first) and return
      return searches.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
      return [];
    }
  }

  /**
   * Add a new search to recent searches
   * Automatically deduplicates and maintains max limit
   */
  async addRecentSearch(query: string, location?: string): Promise<void> {
    try {
      const currentSearches = await this.getRecentSearches();
      
      // Create new search entry
      const newSearch: RecentSearch = {
        query: query.trim(),
        location: location?.trim() || undefined,
        timestamp: Date.now(),
      };

      // Remove duplicate searches (same query and location)
      const filteredSearches = currentSearches.filter(search => 
        !(search.query.toLowerCase() === newSearch.query.toLowerCase() && 
          (search.location || '') === (newSearch.location || ''))
      );

      // Add new search at the beginning
      const updatedSearches = [newSearch, ...filteredSearches];

      // Keep only the most recent searches (up to MAX_SEARCHES)
      const trimmedSearches = updatedSearches.slice(0, RECENT_SEARCHES_CONFIG.MAX_SEARCHES);

      // Save to storage
      await AsyncStorage.setItem(
        RECENT_SEARCHES_CONFIG.STORAGE_KEY, 
        JSON.stringify(trimmedSearches)
      );

      console.log('Added recent search:', newSearch);
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_CONFIG.STORAGE_KEY);
      console.log('Cleared all recent searches');
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }

  /**
   * Remove a specific recent search
   */
  async removeRecentSearch(query: string, location?: string): Promise<void> {
    try {
      const currentSearches = await this.getRecentSearches();
      
      // Filter out the search to remove
      const filteredSearches = currentSearches.filter(search => 
        !(search.query.toLowerCase() === query.toLowerCase() && 
          (search.location || '') === (location || ''))
      );

      // Save updated list
      await AsyncStorage.setItem(
        RECENT_SEARCHES_CONFIG.STORAGE_KEY, 
        JSON.stringify(filteredSearches)
      );

      console.log('Removed recent search:', { query, location });
    } catch (error) {
      console.warn('Failed to remove recent search:', error);
    }
  }

  /**
   * Get recent search queries only (for quick suggestions)
   */
  async getRecentQueries(): Promise<string[]> {
    const searches = await this.getRecentSearches();
    const uniqueQueries = [...new Set(searches.map(search => search.query))];
    return uniqueQueries.slice(0, 5); // Limit to 5 for quick suggestions
  }

  /**
   * Format recent search for display
   */
  formatSearchForDisplay(search: RecentSearch): string {
    if (search.location) {
      return `${search.query} in ${search.location}`;
    }
    return search.query;
  }

  /**
   * Get time since search was made
   */
  getTimeSinceSearch(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return 'Over a week ago';
    }
  }
}

export const recentSearchesManager = new RecentSearchesManager(); 