import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { initializeNotificationService } from './src/utils/notificationService';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import JobsScreen from './src/screens/JobsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UploadResumeScreen from './src/screens/UploadResumeScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  UploadResume: undefined;
  JobDetails: { jobId: string };
  Settings: undefined;
  NotificationSettings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Jobs: { searchQuery?: string; searchLocation?: string } | undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main tab navigator component with theme support
 * Handles the bottom tab navigation between Home, Search, Jobs, and Profile
 */
function MainTabNavigator() {
  const { isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDark ? '#0A84FF' : '#007AFF',
        tabBarInactiveTintColor: isDark ? '#EBEBF599' : '#3C3C4399',
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
          borderTopColor: isDark ? '#38383A' : '#E5E5EA',
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Jobs" component={JobsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/**
 * App content component with theme-aware navigation
 */
function AppContent() {
  const { isDark } = useTheme();
  
  /**
   * Initialize notification service on app startup
   */
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initNotifications = async () => {
      try {
        const result = await initializeNotificationService();
        if (typeof result === 'function') {
          cleanup = result;
        }
      } catch (error) {
        console.error('Failed to initialize notification service:', error);
      }
    };

    initNotifications();

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen 
          name="UploadResume" 
          component={UploadResumeScreen}
          options={{
            headerShown: true,
            title: 'Upload Resume',
            headerStyle: {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            },
            headerTintColor: isDark ? '#FFFFFF' : '#000000',
            headerTitleStyle: {
              color: isDark ? '#FFFFFF' : '#000000',
            },
          }}
        />
        <Stack.Screen 
          name="JobDetails" 
          component={JobDetailsScreen}
          options={{
            headerShown: true,
            title: 'Job Details',
            headerStyle: {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            },
            headerTintColor: isDark ? '#FFFFFF' : '#000000',
            headerTitleStyle: {
              color: isDark ? '#FFFFFF' : '#000000',
            },
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

/**
 * Main app component with theme provider
 * Wraps the entire app with ThemeProvider, SafeAreaProvider and NavigationContainer
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
