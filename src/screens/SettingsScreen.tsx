import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import ModernToggle from '../components/ModernToggle';
import { useTheme } from '../contexts/ThemeContext';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface SettingsState {
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
  const { isDark, themeMode, toggleTheme } = useTheme();
  
  const [settings, setSettings] = useState<SettingsState>({
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
   * Handle dark mode toggle
   */
  const handleDarkModeToggle = () => {
    toggleTheme();
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
   * Render setting item with modern toggle switch
   */
  const renderToggleItem = (
    title: string,
    subtitle: string,
    icon: string,
    settingKey: keyof SettingsState,
    value: boolean
  ) => (
    <View style={[styles.settingItem, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        <Ionicons 
          name={icon as any} 
          size={22} 
          color={isDark ? '#0A84FF' : '#007AFF'} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
          {subtitle}
        </Text>
      </View>
      <ModernToggle
        value={value}
        onValueChange={(newValue) => handleToggle(settingKey, newValue)}
        accessibilityLabel={`Toggle ${title}`}
        accessibilityHint={subtitle}
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
    rightText?: string,
    isDestructive?: boolean
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]} 
      onPress={onPress} 
      activeOpacity={0.6}
    >
      <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        <Ionicons 
          name={icon as any} 
          size={22} 
          color={isDestructive ? '#FF3B30' : (isDark ? '#0A84FF' : '#007AFF')} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle, 
          { 
            color: isDestructive ? '#FF3B30' : (isDark ? '#FFFFFF' : '#000000')
          }
        ]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.rightContent}>
        {rightText && (
          <Text style={[styles.rightText, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
            {rightText}
          </Text>
        )}
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color={isDark ? '#8E8E93' : '#C7C7CC'} 
        />
      </View>
    </TouchableOpacity>
  );

  /**
   * Render section header with modern styling
   */
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
      {title}
    </Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#0A84FF' : '#007AFF'} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <View style={[styles.settingItem, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Ionicons 
                name="moon-outline" 
                size={22} 
                color={isDark ? '#0A84FF' : '#007AFF'} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingSubtitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
                {themeMode === 'system' ? 'Follow system setting' : `${themeMode === 'dark' ? 'Dark' : 'Light'} mode enabled`}
              </Text>
            </View>
            <ModernToggle
              value={themeMode === 'dark' || (themeMode === 'system' && isDark)}
              onValueChange={handleDarkModeToggle}
              accessibilityLabel="Toggle Dark Mode"
              accessibilityHint="Switch between light and dark theme"
            />
          </View>
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
            handleClearData,
            undefined,
            true // isDestructive
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.29)',
    // Modern iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 36, // Compensate for back button
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 35,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    // Modern iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 1,
  },
  settingSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 120,
  },
  rightText: {
    fontSize: 17,
    marginRight: 6,
    textAlign: 'right',
  },
});