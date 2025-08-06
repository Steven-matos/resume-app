import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
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
   * Render toggle setting item
   */
  const renderToggleItem = (
    title: string,
    subtitle: string,
    icon: string,
    settingKey: keyof NotificationSettings,
    value: boolean,
    disabled = false
  ) => (
    <View style={[styles.settingItem, disabled && styles.disabledItem]}>
      <View style={styles.settingIcon}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={disabled ? '#C7C7CC' : '#007AFF'} 
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => handleToggle(settingKey, newValue)}
        disabled={disabled}
        trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  /**
   * Render action button item
   */
  const renderActionItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    rightText?: string,
    color = '#007AFF'
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color }]}>{title}</Text>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading notification settings...</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Permission Status */}
        {renderSectionHeader('Permission Status')}
        <View style={styles.section}>
          <View style={styles.permissionStatus}>
            <View style={styles.permissionIcon}>
              <Ionicons 
                name={permissionStatus === 'granted' ? 'checkmark-circle' : 'alert-circle'} 
                size={32} 
                color={getPermissionStatusColor()} 
              />
            </View>
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>
                Notifications {getPermissionStatusText()}
              </Text>
              <Text style={styles.permissionSubtitle}>
                {permissionStatus === 'granted' 
                  ? 'You will receive notifications based on your preferences below.'
                  : 'Enable notifications to receive job alerts and updates.'
                }
              </Text>
            </View>
            {permissionStatus !== 'granted' && (
              <TouchableOpacity 
                style={styles.enableButton} 
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
            <View style={styles.section}>
              <View style={styles.debugItem}>
                <Text style={styles.debugTitle}>Expo Push Token:</Text>
                <Text style={styles.debugText} numberOfLines={2}>
                  {expoPushToken}
                </Text>
              </View>
              <View style={styles.debugItem}>
                <Text style={styles.debugTitle}>Permission Status:</Text>
                <Text style={styles.debugText}>{permissionStatus}</Text>
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
    marginRight: 32,
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
  disabledItem: {
    opacity: 0.5,
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
  disabledText: {
    color: '#C7C7CC',
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
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  permissionIcon: {
    marginRight: 16,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  enableButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});