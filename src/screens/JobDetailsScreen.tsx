import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type JobDetailsScreenRouteProp = RouteProp<RootStackParamList, 'JobDetails'>;
type JobDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'JobDetails'>;

/**
 * Job interface for type safety
 */
interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchRate: number;
  postedDate: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  companyInfo: {
    name: string;
    size: string;
    industry: string;
    description: string;
  };
}

/**
 * Mock job details data
 */
const mockJobDetails: JobDetails = {
  id: '1',
  title: 'Senior Software Engineer',
  company: 'TechCorp Inc.',
  location: 'San Francisco, CA',
  salary: '$120,000 - $150,000',
  matchRate: 95,
  postedDate: '2 days ago',
  description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing high-quality software solutions and mentoring junior developers.',
  requirements: [
    '5+ years of experience in software development',
    'Strong knowledge of React Native and TypeScript',
    'Experience with mobile app development',
    'Excellent problem-solving skills',
    'Strong communication and teamwork abilities',
  ],
  responsibilities: [
    'Develop and maintain mobile applications',
    'Collaborate with cross-functional teams',
    'Mentor junior developers',
    'Participate in code reviews',
    'Contribute to technical architecture decisions',
  ],
  benefits: [
    'Competitive salary and equity',
    'Health, dental, and vision insurance',
    'Flexible work hours and remote options',
    'Professional development opportunities',
    'Team events and activities',
  ],
  companyInfo: {
    name: 'TechCorp Inc.',
    size: '100-500 employees',
    industry: 'Technology',
    description: 'TechCorp is a leading technology company focused on innovative mobile solutions.',
  },
};

/**
 * JobDetailsScreen component
 * Displays detailed job information with application functionality
 */
export default function JobDetailsScreen() {
  const route = useRoute<JobDetailsScreenRouteProp>();
  const navigation = useNavigation<JobDetailsScreenNavigationProp>();
  const [isApplied, setIsApplied] = useState(false);

  const { jobId } = route.params;
  const jobDetails = mockJobDetails; // In real app, fetch based on jobId

  /**
   * Handles job application
   */
  const handleApply = () => {
    Alert.alert(
      'Apply for Job',
      'Are you sure you want to apply for this position?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Apply',
          onPress: () => {
            setIsApplied(true);
            Alert.alert('Success', 'Your application has been submitted!');
          },
        },
      ]
    );
  };

  /**
   * Renders list item with icon
   */
  const renderListItem = (item: string, icon: string) => (
    <View key={item} style={styles.listItem}>
      <Ionicons name={icon as any} size={16} color="#007AFF" />
      <Text style={styles.listItemText}>{item}</Text>
    </View>
  );

  /**
   * Renders section with title and content
   */
  const renderSection = (title: string, items: string[], icon: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map(item => renderListItem(item, icon))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{jobDetails.title}</Text>
            <Text style={styles.jobCompany}>{jobDetails.company}</Text>
          </View>
          <View style={styles.matchRateContainer}>
            <Text style={styles.matchRateText}>{jobDetails.matchRate}%</Text>
            <Text style={styles.matchRateLabel}>Match</Text>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{jobDetails.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{jobDetails.salary}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{jobDetails.postedDate}</Text>
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.descriptionText}>{jobDetails.description}</Text>
        </View>

        {/* Requirements */}
        {renderSection('Requirements', jobDetails.requirements, 'checkmark-circle-outline')}

        {/* Responsibilities */}
        {renderSection('Responsibilities', jobDetails.responsibilities, 'list-outline')}

        {/* Benefits */}
        {renderSection('Benefits', jobDetails.benefits, 'gift-outline')}

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {jobDetails.companyInfo.name}</Text>
          <View style={styles.companyInfo}>
            <View style={styles.companyDetail}>
              <Ionicons name="business-outline" size={16} color="#8E8E93" />
              <Text style={styles.companyDetailText}>{jobDetails.companyInfo.size}</Text>
            </View>
            <View style={styles.companyDetail}>
              <Ionicons name="briefcase-outline" size={16} color="#8E8E93" />
              <Text style={styles.companyDetailText}>{jobDetails.companyInfo.industry}</Text>
            </View>
          </View>
          <Text style={styles.companyDescription}>{jobDetails.companyInfo.description}</Text>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyContainer}>
        <TouchableOpacity
          style={[
            styles.applyButton,
            isApplied && styles.applyButtonApplied
          ]}
          onPress={handleApply}
          disabled={isApplied}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isApplied ? "checkmark-circle" : "send"} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.applyButtonText}>
            {isApplied ? 'Applied' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100, // Space for apply button
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 16,
    color: '#007AFF',
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
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  companyInfo: {
    marginBottom: 12,
  },
  companyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyDetailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  companyDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  applyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonApplied: {
    backgroundColor: '#34C759',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 