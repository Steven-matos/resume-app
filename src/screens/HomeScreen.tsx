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
import { useTheme, useThemeColors, useThemeShadows } from '../contexts/ThemeContext';
import { useCommonThemedStyles } from '../hooks/useThemedStyles';

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
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const shadows = useThemeShadows();
  const commonStyles = useCommonThemedStyles();

  /**
   * Navigates to the upload resume screen
   */
  const handleUploadResume = () => {
    navigation.navigate('UploadResume');
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={commonStyles.title1}>Welcome back!</Text>
          <Text style={commonStyles.subheadline}>
            Ready to find your next opportunity?
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[commonStyles.card, styles.actionCard]}
            onPress={handleUploadResume}
            activeOpacity={0.7}
          >
            <View style={[commonStyles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="cloud-upload" size={24} color={colors.accent} />
            </View>
            <View style={styles.actionContent}>
              <Text style={commonStyles.headline}>Upload Resume</Text>
              <Text style={commonStyles.footnote}>
                Get matched with jobs and recommendations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.card, styles.actionCard]}
            onPress={() => navigation.navigate('Jobs')}
            activeOpacity={0.7}
          >
            <View style={[commonStyles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="briefcase" size={24} color={colors.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={commonStyles.headline}>Browse Jobs</Text>
              <Text style={commonStyles.footnote}>
                View your matched opportunities
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.card, styles.actionCard]}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <View style={[commonStyles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="search" size={24} color={colors.warning} />
            </View>
            <View style={styles.actionContent}>
              <Text style={commonStyles.headline}>Search Jobs</Text>
              <Text style={commonStyles.footnote}>
                Find specific positions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiaryLabel} />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[commonStyles.title3, { marginBottom: 16 }]}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={[commonStyles.compactCard, styles.statCard]}>
              <Text style={[commonStyles.title2, { color: colors.accent }]}>12</Text>
              <Text style={commonStyles.caption1}>Jobs Matched</Text>
            </View>
            <View style={[commonStyles.compactCard, styles.statCard]}>
              <Text style={[commonStyles.title2, { color: colors.success }]}>3</Text>
              <Text style={commonStyles.caption1}>Applications</Text>
            </View>
            <View style={[commonStyles.compactCard, styles.statCard]}>
              <Text style={[commonStyles.title2, { color: colors.warning }]}>85%</Text>
              <Text style={commonStyles.caption1}>Match Rate</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  quickActions: {
    marginBottom: 32,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0, // Override card margin
  },
  actionContent: {
    flex: 1,
    marginLeft: 4,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginVertical: 0, // Override card margin
  },
}); 