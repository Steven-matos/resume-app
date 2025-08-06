import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  jobAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoSave: boolean;
  dataUsage: 'wifi' | 'cellular' | 'both';
  language: string;
}

/**
 * SettingsScreen component
 * Comprehensive settings management for the resume app
 * Includes notification preferences, app settings, and user preferences
 */
export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const systemColorScheme = useColorScheme();
  
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: systemColorScheme === 'dark',
    notifications: true,
    jobAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    autoSave: true,
    dataUsage: 'both',
    language: 'English',
  });

  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load settings from AsyncStorage on component mount
   */
  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Load saved settings from AsyncStorage
   */
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({ ...prevSettings, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save settings to AsyncStorage
   */
  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  /**
   * Handle toggle switch changes
   */
  const handleToggle = (key: keyof SettingsState, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);

    // Handle specific toggle actions
    if (key === 'pushNotifications' && !value) {
      Alert.alert(
        'Push Notifications Disabled',
        'You will no longer receive job alerts and updates. You can re-enable this in settings anytime.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle data usage selection
   */
  const handleDataUsageChange = () => {
    const options = ['WiFi Only', 'Cellular Only', 'WiFi + Cellular'];
    const values = ['wifi', 'cellular', 'both'] as const;
    
    Alert.alert(
      'Data Usage',
      'Choose when to sync data and receive updates:',
      [
        ...options.map((option, index) => ({
          text: option,
          onPress: () => {
            const newSettings = { ...settings, dataUsage: values[index] };
            setSettings(newSettings);
            saveSettings(newSettings);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * Handle language selection
   */
  const handleLanguageChange = () => {
    const languages = ['English', 'Spanish', 'French', 'German', 'Chinese'];
    
    Alert.alert(
      'Language',
      'Select your preferred language:',
      [
        ...languages.map(lang => ({
          text: lang,
          onPress: () => {
            const newSettings = { ...settings, language: lang };
            setSettings(newSettings);
            saveSettings(newSettings);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * Clear all app data
   */
  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'This will remove all your saved data including job searches, preferences, and cached information. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'recentSearches',
                'jobCache',
                'appSettings',
                'userPreferences'
              ]);
              Alert.alert('Success', 'App data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear app data.');
            }
          },
        },
      ]
    );
  };

  /**
   * Navigate to notification settings
   */
  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  /**
   * Render setting item with toggle switch
   */
  const renderToggleItem = (
    title: string,
    subtitle: string,
    icon: string,
    settingKey: keyof SettingsState,
    value: boolean
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => handleToggle(settingKey, newValue)}
        trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  /**
   * Render setting item with navigation
   */
  const renderNavigationItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    rightText?: string
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#007AFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.rightContent}>
        {rightText && <Text style={styles.rightText}>{rightText}</Text>}
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );

  /**
   * Render section header
   */
  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Notifications Section */}
        {renderSectionHeader('Notifications')}
        <View style={styles.section}>
          {renderNavigationItem(
            'Notification Settings',
            'Manage all notification preferences',
            'notifications-outline',
            handleNotificationSettings
          )}
          {renderToggleItem(
            'Push Notifications',
            'Receive notifications on this device',
            'phone-portrait-outline',
            'pushNotifications',
            settings.pushNotifications
          )}
          {renderToggleItem(
            'Job Alerts',
            'Get notified about new job matches',
            'briefcase-outline',
            'jobAlerts',
            settings.jobAlerts
          )}
          {renderToggleItem(
            'Email Notifications',
            'Receive updates via email',
            'mail-outline',
            'emailNotifications',
            settings.emailNotifications
          )}
        </View>

        {/* App Preferences Section */}
        {renderSectionHeader('App Preferences')}
        <View style={styles.section}>
          {renderToggleItem(
            'Dark Mode',
            'Use dark theme throughout the app',
            'moon-outline',
            'darkMode',
            settings.darkMode
          )}
          {renderToggleItem(
            'Sound Effects',
            'Play sounds for notifications and actions',
            'volume-high-outline',
            'soundEnabled',
            settings.soundEnabled
          )}
          {renderToggleItem(
            'Vibration',
            'Vibrate for notifications and feedback',
            'phone-portrait-outline',
            'vibrationEnabled',
            settings.vibrationEnabled
          )}
          {renderToggleItem(
            'Auto-Save',
            'Automatically save your search preferences',
            'save-outline',
            'autoSave',
            settings.autoSave
          )}
        </View>

        {/* Data & Privacy Section */}
        {renderSectionHeader('Data & Privacy')}
        <View style={styles.section}>
          {renderNavigationItem(
            'Data Usage',
            'Control when to sync data',
            'cellular-outline',
            handleDataUsageChange,
            settings.dataUsage === 'wifi' ? 'WiFi Only' : 
             settings.dataUsage === 'cellular' ? 'Cellular Only' : 'WiFi + Cellular'
          )}
          {renderNavigationItem(
            'Language',
            'Choose your preferred language',
            'language-outline',
            handleLanguageChange,
            settings.language
          )}
          {renderNavigationItem(
            'Clear App Data',
            'Remove all saved data and preferences',
            'trash-outline',
            handleClearData
          )}
        </View>

        {/* About Section */}
        {renderSectionHeader('About')}
        <View style={styles.section}>
          {renderNavigationItem(
            'Privacy Policy',
            'Learn how we protect your data',
            'shield-checkmark-outline',
            () => Alert.alert('Privacy Policy', 'Privacy policy would be displayed here.')
          )}
          {renderNavigationItem(
            'Terms of Service',
            'Read our terms and conditions',
            'document-text-outline',
            () => Alert.alert('Terms of Service', 'Terms of service would be displayed here.')
          )}
          {renderNavigationItem(
            'Help & Support',
            'Get help or contact support',
            'help-circle-outline',
            () => Alert.alert('Help & Support', 'Support options would be displayed here.')
          )}
          {renderNavigationItem(
            'App Version',
            'Check for updates and version info',
            'information-circle-outline',
            () => Alert.alert('App Version', 'Version 1.0.0\nBuild 1\n\nYou have the latest version.'),
            '1.0.0'
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginRight: 32, // Compensate for back button
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
  },
});