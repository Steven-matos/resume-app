import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AdminDebugPanel from '../components/AdminDebugPanel';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, RootStackParamList } from '../../App';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

/**
 * HomeScreen component
 * Main landing page with welcome message and quick actions
 */
export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  /**
   * Navigates to the upload resume screen
   */
  const handleUploadResume = () => {
    navigation.navigate('UploadResume');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            Ready to find your next opportunity?
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleUploadResume}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="cloud-upload" size={32} color="#007AFF" />
            </View>
            <Text style={styles.actionTitle}>Upload Resume</Text>
            <Text style={styles.actionSubtitle}>
              Get matched with jobs and recommendations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Jobs')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="briefcase" size={32} color="#34C759" />
            </View>
            <Text style={styles.actionTitle}>Browse Jobs</Text>
            <Text style={styles.actionSubtitle}>
              View your matched opportunities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="search" size={32} color="#FF9500" />
            </View>
            <Text style={styles.actionTitle}>Search Jobs</Text>
            <Text style={styles.actionSubtitle}>
              Find specific positions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Jobs Matched</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Match Rate</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Admin Debug Panel - Only visible in development */}
      <AdminDebugPanel />
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
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  quickActions: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
}); 