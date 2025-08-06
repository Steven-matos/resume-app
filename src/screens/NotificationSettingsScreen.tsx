import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import ModernToggle from '../components/ModernToggle';
import { useTheme } from '../contexts/ThemeContext';

type NotificationSettingsNavigationProp = StackNavigationProp<RootStackParamList>;

interface NotificationSettings {
  enabled: boolean;
  jobMatches: boolean;
  applicationUpdates: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  instantAlerts: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeCount: boolean;
  showPreviews: boolean;
  criticalAlerts: boolean;
}

/**
 * NotificationSettingsScreen component
 * Comprehensive notification management for the resume app
 * Handles push notification permissions, preferences, and scheduling
 */
export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsNavigationProp>();
  const { isDark } = useTheme();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    jobMatches: true,
    applicationUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
    instantAlerts: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
    soundEnabled: true,
    vibrationEnabled: true,
    badgeCount: true,
    showPreviews: true,
    criticalAlerts: true,
  });

  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize notification settings and permissions on component mount
   */
  useEffect(() => {
    initializeNotifications();
  }, []);

  /**
   * Initialize notification system
   * Load settings and check permissions
   */
  const initializeNotifications = async () => {
    try {
      await loadNotificationSettings();
      await checkNotificationPermissions();
      await registerForPushNotifications();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load notification settings from AsyncStorage
   */
  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({ ...prevSettings, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  /**
   * Save notification settings to AsyncStorage
   */
  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings.');
    }
  };

  /**
   * Check current notification permissions
   */
  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  /**
   * Register for push notifications and get Expo push token
   */
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      Alert.alert('Error', 'Push notifications only work on physical devices.');
      return;
    }

    try {
      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Job Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('updates', {
          name: 'App Updates',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('marketing', {
          name: 'Marketing',
          importance: Notifications.AndroidImportance.LOW,
        });
      }

      // Get push token
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (projectId) {
        const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        setExpoPushToken(pushTokenString);
        await AsyncStorage.setItem('expoPushToken', pushTokenString);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  /**
   * Request notification permissions
   */
  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        Alert.alert('Success', 'Notification permissions granted!');
        await registerForPushNotifications();
      } else {
        Alert.alert(
          'Permissions Required',
          'To receive job alerts and updates, please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Notifications.openSettingsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };

  /**
   * Handle notification setting toggle
   */
  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);

    // Handle specific actions for certain toggles
    if (key === 'enabled' && !value) {
      Alert.alert(
        'Notifications Disabled',
        'You will no longer receive any notifications from this app. You can re-enable them anytime in settings.',
        [{ text: 'OK' }]
      );
    }

    if (key === 'jobMatches' && value && permissionStatus !== 'granted') {
      requestPermissions();
    }
  };

  /**
   * Handle quiet hours time selection
   */
  const handleQuietHoursTime = (type: 'start' | 'end') => {
    const hours = Array.from({ length: 24 }, (_, i) => 
      `${i.toString().padStart(2, '0')}:00`
    );

    Alert.alert(
      `Quiet Hours ${type === 'start' ? 'Start' : 'End'}`,
      `Select ${type === 'start' ? 'when' : 'until when'} to pause notifications:`,
      [
        ...hours.map(hour => ({
          text: hour,
          onPress: () => {
            const newSettings = { 
              ...settings, 
              [type === 'start' ? 'quietStart' : 'quietEnd']: hour 
            };
            setSettings(newSettings);
            saveNotificationSettings(newSettings);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * Send test notification
   */
  const sendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert('Error', 'Notification permissions not granted.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Test Notification',
          body: 'This is a test notification from your Resume App!',
          data: { type: 'test' },
          sound: settings.soundEnabled ? 'default' : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
        },
      });

      Alert.alert('Success', 'Test notification sent! Check your notifications.');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  /**
   * Clear all scheduled notifications
   */
  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will cancel all scheduled notifications. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Notifications.cancelAllScheduledNotificationsAsync();
              Alert.alert('Success', 'All scheduled notifications have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications.');
            }
          },
        },
      ]
    );
  };

  /**
   * Render toggle setting item with modern styling
   */
  const renderToggleItem = (
    title: string,
    subtitle: string,
    icon: string,
    settingKey: keyof NotificationSettings,
    value: boolean,
    disabled = false
  ) => (
    <View style={[
      styles.settingItem, 
      { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
      disabled && styles.disabledItem
    ]}>
      <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        <Ionicons 
          name={icon as any} 
          size={22} 
          color={disabled ? (isDark ? '#48484A' : '#C7C7CC') : (isDark ? '#0A84FF' : '#007AFF')} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[
          styles.settingTitle, 
          { color: disabled ? (isDark ? '#48484A' : '#C7C7CC') : (isDark ? '#FFFFFF' : '#000000') }
        ]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
          {subtitle}
        </Text>
      </View>
      <ModernToggle
        value={value}
        onValueChange={(newValue) => handleToggle(settingKey, newValue)}
        disabled={disabled}
        accessibilityLabel={`Toggle ${title}`}
        accessibilityHint={subtitle}
      />
    </View>
  );

  /**
   * Render action button item with modern styling
   */
  const renderActionItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    rightText?: string,
    color?: string
  ) => {
    const isDestructive = color === '#FF3B30';
    const itemColor = color || (isDark ? '#0A84FF' : '#007AFF');
    
    return (
      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]} 
        onPress={onPress} 
        activeOpacity={0.6}
      >
        <View style={[styles.settingIcon, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
          <Ionicons name={icon as any} size={22} color={itemColor} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: itemColor }]}>{title}</Text>
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
  };

  /**
   * Render section header with modern styling
   */
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
      {title}
    </Text>
  );

  /**
   * Get permission status display text
   */
  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      case 'undetermined':
        return 'Not Set';
      default:
        return 'Unknown';
    }
  };

  /**
   * Get permission status color
   */
  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted':
        return '#34C759';
      case 'denied':
        return '#FF3B30';
      default:
        return '#FF9500';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
            Loading notification settings...
          </Text>
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
          Notifications
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status */}
        {renderSectionHeader('Permission Status')}
        <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
          <View style={styles.permissionStatus}>
            <View style={styles.permissionIcon}>
              <Ionicons 
                name={permissionStatus === 'granted' ? 'checkmark-circle' : 'alert-circle'} 
                size={32} 
                color={getPermissionStatusColor()} 
              />
            </View>
            <View style={styles.permissionContent}>
              <Text style={[styles.permissionTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Notifications {getPermissionStatusText()}
              </Text>
              <Text style={[styles.permissionSubtitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
                {permissionStatus === 'granted' 
                  ? 'You will receive notifications based on your preferences below.'
                  : 'Enable notifications to receive job alerts and updates.'
                }
              </Text>
            </View>
            {permissionStatus !== 'granted' && (
              <TouchableOpacity 
                style={[styles.enableButton, { backgroundColor: isDark ? '#0A84FF' : '#007AFF' }]} 
                onPress={requestPermissions}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Types */}
        {renderSectionHeader('Notification Types')}
        <View style={styles.section}>
          {renderToggleItem(
            'Job Matches',
            'Get notified when new jobs match your profile',
            'briefcase-outline',
            'jobMatches',
            settings.jobMatches,
            !settings.enabled
          )}
          {renderToggleItem(
            'Application Updates',
            'Updates on your job application status',
            'document-text-outline',
            'applicationUpdates',
            settings.applicationUpdates,
            !settings.enabled
          )}
          {renderToggleItem(
            'Weekly Digest',
            'Weekly summary of new opportunities',
            'calendar-outline',
            'weeklyDigest',
            settings.weeklyDigest,
            !settings.enabled
          )}
          {renderToggleItem(
            'Marketing Emails',
            'Career tips and app updates',
            'mail-outline',
            'marketingEmails',
            settings.marketingEmails,
            !settings.enabled
          )}
        </View>

        {/* Notification Behavior */}
        {renderSectionHeader('Notification Behavior')}
        <View style={styles.section}>
          {renderToggleItem(
            'Instant Alerts',
            'Receive notifications immediately',
            'flash-outline',
            'instantAlerts',
            settings.instantAlerts,
            !settings.enabled
          )}
          {renderToggleItem(
            'Sound',
            'Play sound for notifications',
            'volume-high-outline',
            'soundEnabled',
            settings.soundEnabled,
            !settings.enabled
          )}
          {renderToggleItem(
            'Vibration',
            'Vibrate when receiving notifications',
            'phone-portrait-outline',
            'vibrationEnabled',
            settings.vibrationEnabled,
            !settings.enabled
          )}
          {renderToggleItem(
            'Badge Count',
            'Show notification count on app icon',
            'notifications-outline',
            'badgeCount',
            settings.badgeCount,
            !settings.enabled
          )}
          {renderToggleItem(
            'Show Previews',
            'Display notification content on lock screen',
            'eye-outline',
            'showPreviews',
            settings.showPreviews,
            !settings.enabled
          )}
        </View>

        {/* Quiet Hours */}
        {renderSectionHeader('Quiet Hours')}
        <View style={styles.section}>
          {renderToggleItem(
            'Enable Quiet Hours',
            'Pause notifications during specified hours',
            'moon-outline',
            'quietHours',
            settings.quietHours,
            !settings.enabled
          )}
          {settings.quietHours && (
            <>
              {renderActionItem(
                'Start Time',
                'When to start quiet hours',
                'time-outline',
                () => handleQuietHoursTime('start'),
                settings.quietStart
              )}
              {renderActionItem(
                'End Time',
                'When to end quiet hours',
                'time-outline',
                () => handleQuietHoursTime('end'),
                settings.quietEnd
              )}
            </>
          )}
        </View>

        {/* Actions */}
        {renderSectionHeader('Actions')}
        <View style={styles.section}>
          {renderActionItem(
            'Send Test Notification',
            'Test your notification settings',
            'send-outline',
            sendTestNotification
          )}
          {renderActionItem(
            'Clear All Notifications',
            'Cancel all scheduled notifications',
            'trash-outline',
            clearAllNotifications,
            undefined,
            '#FF3B30'
          )}
        </View>

        {/* Debug Info (Development only) */}
        {__DEV__ && expoPushToken && (
          <>
            {renderSectionHeader('Debug Info')}
            <View style={[styles.section, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <View style={styles.debugItem}>
                <Text style={[styles.debugTitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
                  Expo Push Token:
                </Text>
                <Text style={[styles.debugText, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
                  {expoPushToken}
                </Text>
              </View>
              <View style={styles.debugItem}>
                <Text style={[styles.debugTitle, { color: isDark ? '#8E8E93' : '#6D6D70' }]}>
                  Permission Status:
                </Text>
                <Text style={[styles.debugText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {permissionStatus}
                </Text>
              </View>
            </View>
          </>
        )}
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
    marginRight: 36,
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
  disabledItem: {
    opacity: 0.6,
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
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  permissionIcon: {
    marginRight: 16,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  permissionSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  debugItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60, 60, 67, 0.12)',
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});