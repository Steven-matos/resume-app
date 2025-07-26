import React from 'react';
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

/**
 * ProfileScreen component
 * Displays user profile information and settings
 */
export default function ProfileScreen() {
  /**
   * Mock user data
   */
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '👤',
    jobTitle: 'Software Engineer',
    location: 'San Francisco, CA',
  };

  /**
   * Mock profile stats
   */
  const stats = [
    { label: 'Jobs Applied', value: '12' },
    { label: 'Interviews', value: '5' },
    { label: 'Match Rate', value: '85%' },
  ];

  /**
   * Mock settings menu items
   */
  const menuItems = [
    {
      id: 'resume',
      title: 'My Resume',
      subtitle: 'View and edit your uploaded resume',
      icon: 'document-text-outline',
      action: () => Alert.alert('Resume', 'View resume functionality'),
    },
    {
      id: 'applications',
      title: 'My Applications',
      subtitle: 'Track your job applications',
      icon: 'briefcase-outline',
      action: () => Alert.alert('Applications', 'View applications functionality'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      icon: 'notifications-outline',
      action: () => Alert.alert('Notifications', 'Notification settings'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and account settings',
      icon: 'settings-outline',
      action: () => Alert.alert('Settings', 'App settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      action: () => Alert.alert('Help', 'Help and support'),
    },
  ];

  /**
   * Renders profile stat item
   */
  const renderStatItem = (stat: { label: string; value: string }) => (
    <View key={stat.label} style={styles.statItem}>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  /**
   * Renders menu item
   */
  const renderMenuItem = (item: {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    action: () => void;
  }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.action}
      activeOpacity={0.8}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons name={item.icon as any} size={24} color="#007AFF" />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>{user.avatar}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userJobTitle}>{user.jobTitle}</Text>
            <Text style={styles.userLocation}>{user.location}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            {stats.map(renderStatItem)}
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuContainer}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => Alert.alert('Logout', 'Logout functionality')}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    fontSize: 48,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F8FF',
    textAlign: 'center',
    lineHeight: 64,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userJobTitle: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 14,
    color: '#8E8E93',
  },
  editButton: {
    padding: 8,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
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
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
}); 