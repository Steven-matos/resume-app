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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../App';
import { Job } from '../types/job';
import { jobApiService } from '../utils/jobApi';

type JobsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Jobs'>,
  StackNavigationProp<RootStackParamList>
>;

/**
 * Mock job data for demonstration (fallback)
 */
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120,000 - $150,000',
    matchRate: 95,
    postedDate: '2 days ago',
    description: 'We are looking for a Senior Software Engineer to join our growing team...',
    requirements: ['React Native', 'TypeScript', '5+ years experience'],
  },
  {
    id: '2',
    title: 'Mobile App Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$90,000 - $110,000',
    matchRate: 88,
    postedDate: '1 day ago',
    description: 'Join our innovative team building the next generation of mobile apps...',
    requirements: ['React Native', 'Expo', '3+ years experience'],
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    company: 'Enterprise Solutions',
    location: 'New York, NY',
    salary: '$100,000 - $130,000',
    matchRate: 82,
    postedDate: '3 days ago',
    description: 'Looking for a talented Full Stack Developer to work on exciting projects...',
    requirements: ['React', 'Node.js', '4+ years experience'],
  },
];

/**
 * JobsScreen component
 * Displays matched jobs with filtering and sorting options
 */
export default function JobsScreen() {
  const navigation = useNavigation<JobsScreenNavigationProp>();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('Software Engineer');

  /**
   * Load jobs from API
   */
  const loadJobs = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await jobApiService.searchJobs({
        query: searchQuery,
        limit: 20,
        fromage: 30
      });

      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      // Fallback to mock data
      setJobs(mockJobs);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Load jobs on component mount
   */
  useEffect(() => {
    loadJobs();
  }, []);

  /**
   * Navigates to job details screen
   */
  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobDetails', { jobId });
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
   * Renders filter button
   */
  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matched Jobs</Text>
        <Text style={styles.headerSubtitle}>
          {mockJobs.length} opportunities found
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('recent', 'Recent')}
        {renderFilterButton('high-match', 'High Match')}
      </View>

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
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
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
            </View>
          }
        />
      )}
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
  },
}); 