import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../App';
import { jobApiService } from '../utils/jobApi';
import { Job } from '../types/job';
import { recentSearchesManager, RecentSearch } from '../utils/recentSearches';
import { useTheme, useThemeColors } from '../contexts/ThemeContext';

type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  StackNavigationProp<RootStackParamList>
>;

/**
 * SearchScreen component
 * Provides job search functionality with filters and recent searches
 */
export default function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchResults, setLastSearchResults] = useState<Job[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loadingRecentSearches, setLoadingRecentSearches] = useState(true);

  /**
   * Load recent searches from storage
   */
  const loadRecentSearches = async () => {
    try {
      setLoadingRecentSearches(true);
      const searches = await recentSearchesManager.getRecentSearches();
      setRecentSearches(searches);
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    } finally {
      setLoadingRecentSearches(false);
    }
  };
  
  /**
   * Load recent searches on component mount
   */
  React.useEffect(() => {
    loadRecentSearches();
  }, []);
  
  /**
   * Save search to recent searches
   */
  const saveToRecentSearches = async (query: string, searchLocation?: string) => {
    try {
      await recentSearchesManager.addRecentSearch(query, searchLocation);
      // Reload recent searches to update the UI
      await loadRecentSearches();
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  };

  /**
   * Mock job categories
   */
  const categories = [
    { id: 'all', label: 'All Jobs' },
    { id: 'tech', label: 'Technology' },
    { id: 'design', label: 'Design' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'sales', label: 'Sales' },
  ];

  /**
   * Handles search submission with real API call
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a job title or keyword to search.');
      return;
    }

    setIsSearching(true);
    
    try {
      // Perform real job search using JSearch API with progressive loading
      const searchParams = {
        query: searchQuery.trim(),
        location: location.trim() || undefined,
        limit: 100, // High limit for comprehensive results
        jobType: selectedCategory !== 'all' ? selectedCategory : undefined,
        maxPages: 5, // Reduced to 5 pages to prevent timeout issues
      };

      console.log('Searching with params:', searchParams);
      
      const response = await jobApiService.searchJobs(searchParams);
      
      // Store search results for coordination with JobsScreen
      setLastSearchResults(response.jobs);
      setLastSearchQuery(searchQuery.trim());
      
      // Save to recent searches
      await saveToRecentSearches(searchQuery.trim(), location.trim() || undefined);
      
      if (response.jobs.length > 0) {
        // Navigate to Jobs screen which will use the same API call to get results
        navigation.navigate('Jobs', { 
          searchQuery: searchQuery.trim(), 
          searchLocation: location.trim() || undefined 
        });
        
        const locationMessage = location.trim() 
          ? ` in ${location.trim()}` 
          : '';
        
        Alert.alert(
          'Search Complete', 
          `Found ${response.jobs.length} jobs for "${searchQuery}"${locationMessage}.\n\nShowing first 10 results immediately. More will load in the background and can be accessed with "Load More" button.`
        );
      } else {
        const locationMessage = location.trim() 
          ? ` in ${location.trim()}` 
          : '';
        
        const suggestion = location.trim() 
          ? 'Try different keywords, broaden your location search (e.g., just city name instead of full address), or remove location filter to see more results.'
          : 'Try different keywords or add a location to narrow down results.';
        
        Alert.alert(
          'No Results', 
          `No jobs found for "${searchQuery}"${locationMessage}.\n\n${suggestion}`
        );
      }
      
    } catch (error) {
      console.error('Search error:', error);
      
      // Provide specific error message for timeouts
      if ((error as any).message?.includes('timeout') || (error as any).code === 'ECONNABORTED') {
        Alert.alert(
          'Search Timeout', 
          'The search is taking longer than expected. Try using more specific search terms or try again in a few moments.'
        );
      } else {
        Alert.alert(
          'Search Error', 
          'Unable to search for jobs right now. Please try again later.'
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle popular search selection
   */
  const handlePopularSearchSelection = async (query: string) => {
    setSearchQuery(query);
    // Keep location if user has set one, otherwise clear it
    const currentLocation = location.trim();
    
    // Immediately perform the search with progressive loading
    const searchParams = {
      query: query.trim(),
      location: currentLocation || undefined,
      limit: 100, // High limit for comprehensive results
              maxPages: 5, // Reduced to 5 pages to prevent timeout issues
    };

    setIsSearching(true);
    
    try {
      console.log('Performing popular search for:', query);
      const response = await jobApiService.searchJobs(searchParams);
      
      setLastSearchResults(response.jobs);
      setLastSearchQuery(query);
      
      // Save to recent searches
      await saveToRecentSearches(query, currentLocation || undefined);
      
      if (response.jobs.length > 0) {
        navigation.navigate('Jobs', { 
          searchQuery: query, 
          searchLocation: currentLocation || undefined 
        });
        const locationMessage = currentLocation ? ` in ${currentLocation}` : '';
        Alert.alert(
          'Search Complete', 
          `Found ${response.jobs.length} jobs for "${query}"${locationMessage}.\n\nShowing first 10 results immediately. More will load in the background.`
        );
      } else {
        const locationMessage = currentLocation ? ` in ${currentLocation}` : '';
        const suggestion = currentLocation 
          ? 'Try removing the location filter or using a broader location (e.g., just the city name).'
          : 'Try different keywords or add a location filter.';
        
        Alert.alert(
          'No Results', 
          `No jobs found for "${query}"${locationMessage}.\n\n${suggestion}`
        );
      }
    } catch (error) {
      console.error('Popular search error:', error);
      
      // Provide specific error message for timeouts
      if ((error as any).message?.includes('timeout') || (error as any).code === 'ECONNABORTED') {
        Alert.alert('Search Timeout', 'The search is taking longer than expected. Please try again in a few moments.');
      } else {
        Alert.alert('Search Error', 'Unable to search for jobs right now. Please try again later.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Renders category button
   */
  const renderCategoryButton = (category: { id: string; label: string }) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.categoryButtonTextActive
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  /**
   * Renders recent search item
   */
  const renderRecentSearch = (search: RecentSearch) => (
    <TouchableOpacity
      key={`${search.query}-${search.location || 'no-location'}-${search.timestamp}`}
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchSelection(search)}
      activeOpacity={0.8}
    >
      <Ionicons name="time-outline" size={16} color="#8E8E93" />
      <View style={styles.recentSearchContent}>
        <Text style={styles.recentSearchText}>
          {recentSearchesManager.formatSearchForDisplay(search)}
        </Text>
        <Text style={styles.recentSearchTime}>
          {recentSearchesManager.getTimeSinceSearch(search.timestamp)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeRecentSearchButton}
        onPress={() => handleRemoveRecentSearch(search)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={16} color="#8E8E93" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  /**
   * Handle recent search selection
   */
  const handleRecentSearchSelection = (search: RecentSearch) => {
    setSearchQuery(search.query);
    if (search.location) {
      setLocation(search.location);
    }
  };
  
  /**
   * Handle removing a recent search
   */
  const handleRemoveRecentSearch = async (search: RecentSearch) => {
    try {
      await recentSearchesManager.removeRecentSearch(search.query, search.location);
      await loadRecentSearches(); // Refresh the list
    } catch (error) {
      console.warn('Failed to remove recent search:', error);
    }
  };
  
  /**
   * Handle clearing all recent searches
   */
  const handleClearAllRecentSearches = async () => {
    Alert.alert(
      'Clear Recent Searches',
      'Are you sure you want to clear all recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await recentSearchesManager.clearRecentSearches();
              await loadRecentSearches(); // Refresh the list
            } catch (error) {
              console.warn('Failed to clear recent searches:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Jobs</Text>
          <Text style={styles.headerSubtitle}>
            Find your perfect opportunity
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Job title, company, or keywords..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor="#8E8E93"
              editable={!isSearching}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Location Input */}
        <View style={styles.locationContainer}>
          <View style={styles.locationInputContainer}>
            <Ionicons name="location-outline" size={20} color="#8E8E93" />
            <TextInput
              style={styles.locationInput}
              placeholder="Location (optional)"
              value={location}
              onChangeText={setLocation}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor="#8E8E93"
              editable={!isSearching}
            />
            {location.length > 0 && (
              <TouchableOpacity
                onPress={() => setLocation('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={isSearching}
          activeOpacity={0.8}
        >
          {isSearching ? (
            <Text style={styles.searchButtonText}>Searching...</Text>
          ) : (
            <Text style={styles.searchButtonText}>Search Jobs</Text>
          )}
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryButton)}
          </View>
        </View>

        {/* Recent Searches */}
        <View style={styles.recentSearchesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAllRecentSearches}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loadingRecentSearches ? (
            <View style={styles.recentSearchesContainer}>
              <Text style={styles.loadingText}>Loading recent searches...</Text>
            </View>
          ) : recentSearches.length > 0 ? (
            <View style={styles.recentSearchesContainer}>
              {recentSearches.map(renderRecentSearch)}
            </View>
          ) : (
            <View style={styles.emptyRecentSearchesContainer}>
              <Ionicons name="time-outline" size={32} color="#C7C7CC" />
              <Text style={styles.emptyRecentSearchesText}>No recent searches</Text>
              <Text style={styles.emptyRecentSearchesSubtext}>
                Your search history will appear here
              </Text>
            </View>
          )}
        </View>

        {/* Popular Searches */}
        <View style={styles.popularSearchesSection}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.popularSearchesContainer}>
            <TouchableOpacity 
              style={styles.popularSearchItem}
              onPress={() => handlePopularSearchSelection('Remote Jobs')}
              disabled={isSearching}
            >
              <Text style={styles.popularSearchText}>Remote Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.popularSearchItem}
              onPress={() => handlePopularSearchSelection('Software Engineer')}
              disabled={isSearching}
            >
              <Text style={styles.popularSearchText}>Software Engineer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.popularSearchItem}
              onPress={() => handlePopularSearchSelection('Product Manager')}
              disabled={isSearching}
            >
              <Text style={styles.popularSearchText}>Product Manager</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.popularSearchItem}
              onPress={() => handlePopularSearchSelection('Data Scientist')}
              disabled={isSearching}
            >
              <Text style={styles.popularSearchText}>Data Scientist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  recentSearchesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  recentSearchesContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  recentSearchesList: {
    paddingBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noRecentSearchesText: {
    textAlign: 'center',
    color: '#8E8E93',
    paddingVertical: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentSearchContent: {
    flex: 1,
    marginLeft: 8,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  recentSearchTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  removeRecentSearchButton: {
    padding: 4,
  },
  popularSearchesSection: {
    marginBottom: 24,
  },
  popularSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularSearchItem: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularSearchText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyRecentSearchesContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyRecentSearchesText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyRecentSearchesSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
    textAlign: 'center',
  },
}); 