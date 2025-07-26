import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import JobsScreen from './src/screens/JobsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UploadResumeScreen from './src/screens/UploadResumeScreen';
import JobDetailsScreen from './src/screens/JobDetailsScreen';

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  UploadResume: undefined;
  JobDetails: { jobId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Jobs: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main tab navigator component
 * Handles the bottom tab navigation between Home, Search, Jobs, and Profile
 */
function MainTabNavigator() {
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
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
 * Main app component with navigation setup
 * Wraps the entire app with SafeAreaProvider and NavigationContainer
 */
export default function App() {
  return (
    <SafeAreaProvider>
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
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#000000',
            }}
          />
          <Stack.Screen 
            name="JobDetails" 
            component={JobDetailsScreen}
            options={{
              headerShown: true,
              title: 'Job Details',
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTintColor: '#000000',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
