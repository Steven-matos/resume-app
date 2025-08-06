import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../App';
import { Job, JobLoadingState } from '../types/job';
import { jobApiService } from '../utils/jobApi';

type JobsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Jobs'>,
  StackNavigationProp<RootStackParamList>
>;

type JobsScreenRouteProp = RouteProp<MainTabParamList, 'Jobs'>;

/**
 * JobsScreen component
 * Displays live jobs from JSearch API with filtering and sorting options
 * Only shows real API data - no mock data
 */
export default function JobsScreen() {
  const navigation = useNavigation<JobsScreenNavigationProp>();
  const route = useRoute<JobsScreenRouteProp>();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<{ query: string; location: string }>({ query: '', location: '' });
  
  // Progressive loading state
  const [loadingState, setLoadingState] = useState<JobLoadingState>({
    displayedJobs: [],
    allJobs: [],
    isLoadingInitial: true,
    isLoadingMore: false,
    isLoadingBackground: false,
    hasMoreToShow: false,
    backgroundLoadComplete: false,
    currentDisplayCount: 0,
    totalAvailable: 0,
  });
  
  // Legacy state for compatibility
  const jobs = loadingState.displayedJobs;
  const loading = loadingState.isLoadingInitial;
  const [refreshing, setRefreshing] = useState(false);
  const totalJobs = loadingState.totalAvailable;

  /**
   * Update search parameters from navigation params
   */
  useEffect(() => {
    if (route.params?.searchQuery) {
      console.log('New search query from navigation:', route.params.searchQuery);
      setSearchQuery(route.params.searchQuery);
    } else if (!searchQuery) {
      // Set default search query only if none exists
      setSearchQuery('Software Engineer');
    }
    
    if (route.params?.searchLocation) {
      console.log('New search location from navigation:', route.params.searchLocation);
      setSearchLocation(route.params.searchLocation);
    }
  }, [route.params]);

  /**
   * Filters and sorts jobs based on the selected filter
   * @param jobs - Array of jobs to filter
   * @param filter - Selected filter type ('all', 'recent', 'high-match')
   * @returns Filtered and sorted array of jobs
   */
  const applyJobFilter = (jobs: Job[], filter: string): Job[] => {
    console.log(`🔧 applyJobFilter called with filter: ${filter}, jobs count: ${jobs.length}`);
    
    switch (filter) {
      case 'recent':
        // Sort by posted date (newest first - descending order)
        const sortedJobs = [...jobs].sort((a, b) => {
          // Use ISO date for accurate sorting, fallback to postedDate if needed
          const dateStrA = a.postedDateISO || a.postedDate;
          const dateStrB = b.postedDateISO || b.postedDate;
          
          // Parse dates and compare (newer dates first)
          const dateA = new Date(dateStrA);
          const dateB = new Date(dateStrB);
          
          // Check if dates are valid
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.warn('Invalid date found:', { dateStrA, dateStrB });
            return 0; // Keep original order if dates are invalid
          }
          
          const result = dateB.getTime() - dateA.getTime(); // Reversed: B - A for newest first
          return result;
        });
        console.log(`🔧 Recent filter applied. Sample ISO dates:`, sortedJobs.slice(0, 3).map(job => job.postedDateISO || job.postedDate));
        return sortedJobs;
      case 'high-match':
        // Sort by match rate (highest first)
        return [...jobs].sort((a, b) => b.matchRate - a.matchRate);
      case 'all':
      default:
        // Return jobs in original order
        console.log(`🔧 All filter applied. Sample dates:`, jobs.slice(0, 3).map(job => job.postedDate));
        return jobs;
    }
  };

  /**
   * Load jobs with progressive loading - show first 10 immediately, load more in background
   */
  const loadJobs = async (refresh = false) => {
    // Don't search if no query is set
    if (!searchQuery.trim()) {
      console.log('No search query set, skipping job load');
      setLoadingState(prev => ({ ...prev, isLoadingInitial: false }));
      setRefreshing(false);
      return;
    }
    
    try {
      if (refresh) {
        setRefreshing(true);
        // Reset loading state for refresh
        setLoadingState({
          displayedJobs: [],
          allJobs: [],
          isLoadingInitial: true,
          isLoadingMore: false,
          isLoadingBackground: false,
          hasMoreToShow: false,
          backgroundLoadComplete: false,
          currentDisplayCount: 0,
          totalAvailable: 0,
        });
      } else {
        setLoadingState(prev => ({ ...prev, isLoadingInitial: true }));
      }

      // Clear cache only if search parameters have changed
      const currentParams = { query: searchQuery, location: searchLocation };
      const paramsChanged = currentParams.query !== lastSearchParams.query || 
                           currentParams.location !== lastSearchParams.location;
 
      if (paramsChanged && !refresh) {
        console.log('Search parameters changed, clearing cache for fresh results');
        await jobApiService.clearAllCachedData();
        setLastSearchParams(currentParams);
      }

      const locationText = searchLocation ? ` in ${searchLocation}` : '';
      console.log(`🔍 Loading jobs with progressive loading for query: "${searchQuery}"${locationText}`);

      // Set up progress callback for background loading
      const progressCallback = (allJobs: Job[]) => {
        console.log(`📥 Background loading progress: ${allJobs.length} total jobs available`);
        setLoadingState(prev => {
          // Apply current filter to all loaded jobs
          const filteredJobs = applyJobFilter(allJobs, selectedFilter);
          
          const newState = {
            ...prev,
            allJobs,
            totalAvailable: allJobs.length,
            hasMoreToShow: filteredJobs.length > prev.currentDisplayCount,
            isLoadingBackground: false,
            backgroundLoadComplete: true,
          };
          console.log(`📄 Updated state: displaying ${prev.currentDisplayCount} of ${filteredJobs.length} filtered jobs (${allJobs.length} total), hasMoreToShow: ${newState.hasMoreToShow}`);
          return newState;
        });
      };

      const response = await jobApiService.searchJobs({
        query: searchQuery,
        location: searchLocation || undefined,
        limit: 100,
        fromage: 30,
        maxPages: 5, // Reduced to prevent timeout issues
      }, progressCallback);

      console.log(`✅ Received initial ${response.jobs.length} jobs from API for query: "${searchQuery}"${locationText}`);
      
      // Apply current filter to jobs
      const filteredJobs = applyJobFilter(response.jobs, selectedFilter);
      
      // Show first 10 filtered jobs immediately
      const initialDisplayCount = Math.min(10, filteredJobs.length);
      const initialJobs = filteredJobs.slice(0, initialDisplayCount);
      
      const newState = {
        displayedJobs: initialJobs,
        allJobs: response.jobs, // Keep original jobs for filtering
        isLoadingInitial: false,
        isLoadingBackground: response.hasMore,
        hasMoreToShow: filteredJobs.length > initialDisplayCount || response.hasMore,
        currentDisplayCount: initialDisplayCount,
        totalAvailable: response.jobs.length, // Use actual jobs length, not response.total
        backgroundLoadComplete: !response.hasMore,
        isLoadingMore: false,
      };
      
      console.log(`📄 Initial state: displaying ${initialDisplayCount} of ${response.jobs.length} jobs, hasMoreToShow: ${newState.hasMoreToShow}`);
      setLoadingState(newState);
      
      setLastUpdateTime(new Date());
      
      if (response.jobs.length === 0) {
        console.warn(`⚠️ No jobs returned from API for query: "${searchQuery}"${locationText}. Check API key configuration or try different search terms.`);
      }
    } catch (error) {
      console.error('❌ Failed to load jobs:', error);
      
      // Show user-friendly error message for timeouts
      if ((error as any).message?.includes('timeout') || (error as any).code === 'ECONNABORTED') {
        Alert.alert(
          'Search Timeout',
          'The search is taking longer than expected. This might be due to a slow connection or heavy API load.\n\nTry:\n• Using more specific search terms\n• Searching without location filter\n• Trying again in a few moments',
          [{ text: 'OK' }]
        );
      }
      
      // Show empty state - no mock data fallback
      setLoadingState({
        displayedJobs: [],
        allJobs: [],
        isLoadingInitial: false,
        isLoadingMore: false,
        isLoadingBackground: false,
        hasMoreToShow: false,
        backgroundLoadComplete: true,
        currentDisplayCount: 0,
        totalAvailable: 0,
      });
      setLastUpdateTime(null);
    } finally {
      setRefreshing(false);
    }
  };
  
  /**
   * Load more jobs (next 10 from the already loaded results)
   * Respects the current filter selection
   */
  const loadMoreJobs = () => {
    if (loadingState.isLoadingMore || !loadingState.hasMoreToShow) {
      console.log(`🚫 Load more blocked: isLoadingMore=${loadingState.isLoadingMore}, hasMoreToShow=${loadingState.hasMoreToShow}`);
      return;
    }
    
    console.log(`📄 Loading more jobs: current=${loadingState.currentDisplayCount}, total=${loadingState.allJobs.length}, filter=${selectedFilter}`);
    setLoadingState(prev => ({ ...prev, isLoadingMore: true }));
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setLoadingState(prev => {
        // Apply current filter to all jobs
        const filteredJobs = applyJobFilter(prev.allJobs, selectedFilter);
        
        const nextBatchSize = 10;
        const newDisplayCount = Math.min(
          prev.currentDisplayCount + nextBatchSize,
          filteredJobs.length
        );
        
        const newDisplayedJobs = filteredJobs.slice(0, newDisplayCount);
        
        const newState = {
          ...prev,
          displayedJobs: newDisplayedJobs,
          currentDisplayCount: newDisplayCount,
          isLoadingMore: false,
          hasMoreToShow: newDisplayCount < filteredJobs.length,
        };
        
        console.log(`📄 Loaded more jobs: showing ${newDisplayCount} of ${filteredJobs.length} filtered total, hasMoreToShow: ${newState.hasMoreToShow}`);
        return newState;
      });
    }, 500); // Small delay to show loading state
  };

  /**
   * Load jobs on component mount
   */
  useEffect(() => {
    // Only load jobs if we have a search query
    if (searchQuery.trim()) {
      console.log('Search parameters changed, loading jobs:', { searchQuery, searchLocation });
      loadJobs();
    }
  }, [searchQuery, searchLocation]);

  /**
   * Clear cached data and reload fresh from API
   * Useful for debugging to ensure no old mock data is cached
   */
  const clearCacheAndReload = async () => {
    try {
      console.log('Clearing all cached data and reloading...');
      await jobApiService.clearAllCachedData();
      await loadJobs(true);
    } catch (error) {
      console.error('Failed to clear cache and reload:', error);
    }
  };

  /**
   * Navigates to job details screen
   */
  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobDetails', { jobId });
  };

  /**
   * Handle location change from modal
   */
  const handleLocationChange = async () => {
    setSearchLocation(tempLocation);
    setShowLocationModal(false);
    await loadJobs(true); // Reload with new location
  };

  /**
   * Handle search query change from modal
   */
  const handleSearchQueryChange = async () => {
    if (tempSearchQuery.trim()) {
      setSearchQuery(tempSearchQuery.trim());
      setShowSearchModal(false);
      // Jobs will reload automatically due to useEffect dependency
    }
  };

  /**
   * Open location modal with current location
   */
  const openLocationModal = () => {
    setTempLocation(searchLocation);
    setShowLocationModal(true);
  };

  /**
   * Open search query modal with current query
   */
  const openSearchModal = () => {
    setTempSearchQuery(searchQuery);
    setShowSearchModal(true);
  };

  /**
   * Renders individual job card
   */
  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => handleJobPress(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.jobCompany}>{item.company}</Text>
        </View>
        <View style={styles.matchRateContainer}>
          <Text style={styles.matchRateText}>{item.matchRate}%</Text>
          <Text style={styles.matchRateLabel}>Match</Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.salary}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>{item.postedDate}</Text>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.requirementsContainer}>
        {item.requirements.slice(0, 2).map((req, index) => (
          <View key={index} style={styles.requirementTag}>
            <Text style={styles.requirementText}>{req}</Text>
          </View>
        ))}
        {item.requirements.length > 2 && (
          <Text style={styles.moreRequirements}>+{item.requirements.length - 2} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * Handles filter selection and updates displayed jobs
   * @param filter - Selected filter type
   */
  const handleFilterChange = (filter: string) => {
    console.log(`🔍 Filter changed to: ${filter}`);
    setSelectedFilter(filter);
    
    // Apply filter to all loaded jobs and update displayed jobs
    setLoadingState(prev => {
      console.log(`📊 Applying filter "${filter}" to ${prev.allJobs.length} jobs`);
      const filteredJobs = applyJobFilter(prev.allJobs, filter);
      console.log(`📊 Filtered jobs count: ${filteredJobs.length}`);
      
      const currentDisplayCount = Math.min(prev.currentDisplayCount, filteredJobs.length);
      const displayedJobs = filteredJobs.slice(0, currentDisplayCount);
      
      console.log(`📊 Displaying ${displayedJobs.length} jobs after filter`);
      console.log(`📊 First 3 job titles after filter:`, displayedJobs.slice(0, 3).map(job => `${job.title} (${job.postedDate}) [ISO: ${job.postedDateISO}]`));
      
      return {
        ...prev,
        displayedJobs,
        hasMoreToShow: filteredJobs.length > currentDisplayCount,
      };
    });
  };

  /**
   * Renders filter button
   */
  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filter)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  /**
   * Load More Footer Component
   */
  const LoadMoreFooter = ({ loadingState, onLoadMore }: { 
    loadingState: JobLoadingState, 
    onLoadMore: () => void 
  }) => {
    // Debug logging
    console.log(`📄 LoadMoreFooter render:`, {
      hasMoreToShow: loadingState.hasMoreToShow,
      backgroundLoadComplete: loadingState.backgroundLoadComplete,
      isLoadingMore: loadingState.isLoadingMore,
      currentDisplayCount: loadingState.currentDisplayCount,
      totalAvailable: loadingState.totalAvailable,
      allJobsLength: loadingState.allJobs.length
    });
    
    if (!loadingState.hasMoreToShow && loadingState.backgroundLoadComplete) {
      return (
        <View style={styles.loadMoreContainer}>
          <Text style={styles.endOfResultsText}>
            🎉 You've seen all {loadingState.totalAvailable} available jobs!
          </Text>
        </View>
      );
    }
    
    if (loadingState.isLoadingMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingMoreText}>Loading more jobs...</Text>
        </View>
      );
    }
    
    if (loadingState.hasMoreToShow) {
      return (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity 
            style={styles.loadMoreButton}
            onPress={onLoadMore}
            activeOpacity={0.8}
          >
            <Text style={styles.loadMoreButtonText}>
              Load More Jobs
            </Text>
            <Text style={styles.loadMoreSubtext}>
              Showing {loadingState.currentDisplayCount} of {loadingState.backgroundLoadComplete 
                ? loadingState.totalAvailable 
                : `${loadingState.totalAvailable}+`} jobs
            </Text>
          </TouchableOpacity>
          
          {loadingState.isLoadingBackground && (
            <View style={styles.backgroundLoadingIndicator}>
              <ActivityIndicator size="small" color="#8E8E93" />
              <Text style={styles.backgroundLoadingText}>
                Loading more results in background...
              </Text>
            </View>
          )}
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Jobs</Text>
          {searchQuery && (
            <TouchableOpacity onPress={openSearchModal} style={styles.searchQueryContainer}>
              <Text style={styles.searchQueryText}>"{searchQuery}"</Text>
              <Ionicons name="pencil" size={14} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {loadingState.displayedJobs.length > 0 
            ? `Showing ${loadingState.displayedJobs.length}${loadingState.backgroundLoadComplete 
                ? ` of ${loadingState.totalAvailable}` 
                : `+ jobs`} found`
            : 'No jobs loaded'
          }
          {loadingState.isLoadingBackground && (
            <Text style={styles.backgroundLoadingText}>
              {' • Loading more...'}
            </Text>
          )}
          {searchLocation && (
            <TouchableOpacity onPress={openLocationModal}>
              <Text style={styles.locationFilterText}>
                {'\n'}📍 Filtered for: {searchLocation} (tap to change)
              </Text>
            </TouchableOpacity>
          )}
          {!searchLocation && (
            <TouchableOpacity onPress={openLocationModal}>
              <Text style={styles.addLocationText}>
                {'\n'}+ Add location filter
              </Text>
            </TouchableOpacity>
          )}
          {lastUpdateTime && (
            <Text style={styles.lastUpdateText}>
              {'\n'}Last updated: {lastUpdateTime.toLocaleTimeString()}
            </Text>
          )}
        </Text>
        
        {/* Debug Info - Remove this in production */}
        {__DEV__ && (
          <View style={{ backgroundColor: '#f0f0f0', padding: 8, margin: 8, borderRadius: 4 }}>
            <Text style={{ fontSize: 10, color: '#333' }}>
              Debug: displayed={loadingState.currentDisplayCount}, total={loadingState.allJobs.length}, hasMore={loadingState.hasMoreToShow ? 'YES' : 'NO'}, bgComplete={loadingState.backgroundLoadComplete ? 'YES' : 'NO'}
            </Text>
          </View>
        )}
      </View>

      {/* Search Info Bar */}
      {searchQuery && (
        <View style={styles.searchInfoBar}>
          <View style={styles.searchInfoContent}>
            <Ionicons name="search" size={16} color="#007AFF" />
            <Text style={styles.searchInfoText}>
              Showing results for "{searchQuery}"
              {searchLocation && ` in ${searchLocation}`}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.newSearchButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.newSearchButtonText}>New Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('recent', 'Recent')}
        {renderFilterButton('high-match', 'High Match')}
      </View>

      {/* Jobs List with Progressive Loading */}
      {loadingState.isLoadingInitial ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={loadingState.displayedJobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          key={`jobs-list-${selectedFilter}`}
          contentContainerStyle={styles.jobsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadJobs(true)}
              colors={['#007AFF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyText}>No jobs found from API</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? `No results for "${searchQuery}"${searchLocation ? ` in ${searchLocation}` : ''}.` : 'Use the Search tab to find jobs, then view results here.'}
                {searchLocation && '\n\nTry removing the location filter or using a broader location (e.g., just city name instead of full address).'}
                {'\n\n'}To see live job listings, add your JSearch API key:{'\n'}
                EXPO_PUBLIC_RAPIDAPI_KEY=your_key_here{'\n\n'}
                Or try different search terms if your API key is configured.
              </Text>
              <TouchableOpacity
                style={styles.clearCacheButton}
                onPress={clearCacheAndReload}
              >
                <Text style={styles.clearCacheButtonText}>Clear Cache & Reload</Text>
              </TouchableOpacity>
              {!searchQuery && (
                <TouchableOpacity
                  style={[styles.clearCacheButton, { backgroundColor: '#34C759', marginTop: 8 }]}
                  onPress={() => navigation.navigate('Search')}
                >
                  <Text style={styles.clearCacheButtonText}>Go to Search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            loadingState.displayedJobs.length > 0 ? (
              <LoadMoreFooter 
                loadingState={loadingState}
                onLoadMore={loadMoreJobs}
              />
            ) : null
          }
        />
      )}
      
      {/* Location Filter Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Location</Text>
            <Text style={styles.modalSubtitle}>
              Enter a city, state, or region to filter job results
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., San Francisco, CA or Remote"
              value={tempLocation}
              onChangeText={setTempLocation}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalApplyButton]}
                onPress={handleLocationChange}
              >
                <Text style={styles.modalApplyText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
            
            {searchLocation && (
              <TouchableOpacity
                style={styles.removeLocationButton}
                onPress={() => {
                  setTempLocation('');
                  handleLocationChange();
                }}
              >
                <Text style={styles.removeLocationText}>Remove Location Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Search Query Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Search Query</Text>
            <Text style={styles.modalSubtitle}>
              Enter a job title, company, or keywords to search for
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Software Engineer, Product Manager"
              value={tempSearchQuery}
              onChangeText={setTempSearchQuery}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalApplyButton]}
                onPress={handleSearchQueryChange}
              >
                <Text style={styles.modalApplyText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchQueryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
    marginTop: 4,
  },
  searchQueryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F9F9F9',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  jobsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: '#8E8E93',
  },
  matchRateContainer: {
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchRateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  matchRateLabel: {
    fontSize: 10,
    color: '#007AFF',
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  jobDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 12,
  },
  requirementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  requirementTag: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  moreRequirements: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  locationFilterText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  addLocationText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  clearCacheButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  clearCacheButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F9F9F9',
  },
  modalApplyButton: {
    backgroundColor: '#007AFF',
  },
  modalCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  modalApplyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeLocationButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  removeLocationText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  searchInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FF',
  },
  searchInfoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInfoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  newSearchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Load More Footer Styles
  loadMoreContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  endOfResultsText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
    textAlign: 'center',
  },
  backgroundLoadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
  },
  backgroundLoadingText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 8,
    fontStyle: 'italic',
  },
}); 