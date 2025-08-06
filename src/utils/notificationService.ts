import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Notification service utility
 * Handles push notification setup, scheduling, and management
 * Follows DRY principles and provides centralized notification functionality
 */

// Configure notification handler globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'job_match' | 'application_update' | 'weekly_digest' | 'marketing' | 'system';
  jobId?: string;
  applicationId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  [key: string]: any;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data: NotificationData;
  scheduledTime: Date;
  recurring?: boolean;
  interval?: number; // in seconds
}

/**
 * Initialize notification channels for Android
 */
export const initializeNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    // Job Alerts Channel - High priority for immediate job matches
    await Notifications.setNotificationChannelAsync('job_alerts', {
      name: 'Job Alerts',
      description: 'Notifications for new job matches and opportunities',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Application Updates Channel - Normal priority for status updates
    await Notifications.setNotificationChannelAsync('application_updates', {
      name: 'Application Updates',
      description: 'Updates on your job application status',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      enableVibrate: true,
    });

    // Weekly Digest Channel - Low priority for summary information
    await Notifications.setNotificationChannelAsync('weekly_digest', {
      name: 'Weekly Digest',
      description: 'Weekly summary of job opportunities',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
    });

    // Marketing Channel - Low priority for promotional content
    await Notifications.setNotificationChannelAsync('marketing', {
      name: 'Marketing & Tips',
      description: 'Career tips and app updates',
      importance: Notifications.AndroidImportance.LOW,
    });

    // System Channel - High priority for critical app notifications
    await Notifications.setNotificationChannelAsync('system', {
      name: 'System Notifications',
      description: 'Important app notifications and alerts',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
    });
  }
};

/**
 * Register device for push notifications
 * Returns the Expo push token for the device
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    // Initialize notification channels
    await initializeNotificationChannels();

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return null;
    }

    // Get project ID from Expo config
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.error('Project ID not found in Expo config');
      return null;
    }

    // Get Expo push token
    const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    
    // Store token locally
    await AsyncStorage.setItem('expoPushToken', pushTokenString);
    
    console.log('Successfully registered for push notifications:', pushTokenString);
    return pushTokenString;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Check if notifications are enabled based on user settings
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const settings = await AsyncStorage.getItem('notificationSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      return parsedSettings.enabled === true;
    }
    return true; // Default to enabled
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true;
  }
};

/**
 * Check if quiet hours are active
 */
export const isQuietHoursActive = async (): Promise<boolean> => {
  try {
    const settings = await AsyncStorage.getItem('notificationSettings');
    if (!settings) return false;

    const parsedSettings = JSON.parse(settings);
    if (!parsedSettings.quietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = parsedSettings.quietStart.split(':').map(Number);
    const [endHour, endMin] = parsedSettings.quietEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
};

/**
 * Get appropriate notification channel based on type
 */
const getNotificationChannel = (type: NotificationData['type']): string => {
  switch (type) {
    case 'job_match':
      return 'job_alerts';
    case 'application_update':
      return 'application_updates';
    case 'weekly_digest':
      return 'weekly_digest';
    case 'marketing':
      return 'marketing';
    case 'system':
      return 'system';
    default:
      return 'job_alerts';
  }
};

/**
 * Schedule a local notification
 */
export const scheduleNotification = async (
  notification: Omit<ScheduledNotification, 'id'>
): Promise<string | null> => {
  try {
    // Check if notifications are enabled
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) {
      console.log('Notifications are disabled by user');
      return null;
    }

    // Check quiet hours for non-critical notifications
    if (notification.data.priority !== 'critical') {
      const isQuietTime = await isQuietHoursActive();
      if (isQuietTime) {
        console.log('Notification delayed due to quiet hours');
        // Could implement logic to schedule for after quiet hours
        return null;
      }
    }

    // Check user preferences for specific notification types
    const settings = await AsyncStorage.getItem('notificationSettings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      
      // Check type-specific settings
      switch (notification.data.type) {
        case 'job_match':
          if (!parsedSettings.jobMatches) return null;
          break;
        case 'application_update':
          if (!parsedSettings.applicationUpdates) return null;
          break;
        case 'weekly_digest':
          if (!parsedSettings.weeklyDigest) return null;
          break;
        case 'marketing':
          if (!parsedSettings.marketingEmails) return null;
          break;
      }
    }

    // Calculate trigger time
    const triggerTime = notification.scheduledTime.getTime() - Date.now();
    if (triggerTime <= 0) {
      console.warn('Notification scheduled for past time, scheduling immediately');
    }

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.floor(triggerTime / 1000)),
        channelId: getNotificationChannel(notification.data.type),
      },
    });

    console.log('Notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Schedule a recurring notification (e.g., weekly digest)
 */
export const scheduleRecurringNotification = async (
  notification: Omit<ScheduledNotification, 'id'> & { interval: number }
): Promise<string | null> => {
  try {
    const notificationsEnabled = await areNotificationsEnabled();
    if (!notificationsEnabled) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: notification.interval,
        repeats: true,
        channelId: getNotificationChannel(notification.data.type),
      },
    });

    console.log('Recurring notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling recurring notification:', error);
    return null;
  }
};

/**
 * Send immediate notification
 */
export const sendImmediateNotification = async (
  title: string,
  body: string,
  data: NotificationData
): Promise<string | null> => {
  return scheduleNotification({
    title,
    body,
    data,
    scheduledTime: new Date(),
  });
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Notification cancelled:', notificationId);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Schedule job match notification
 */
export const scheduleJobMatchNotification = async (
  jobTitle: string,
  companyName: string,
  jobId: string,
  matchPercentage?: number
): Promise<string | null> => {
  const title = '🎯 New Job Match!';
  const body = matchPercentage 
    ? `${matchPercentage}% match: ${jobTitle} at ${companyName}`
    : `New opportunity: ${jobTitle} at ${companyName}`;

  return sendImmediateNotification(title, body, {
    type: 'job_match',
    jobId,
    priority: 'high',
    matchPercentage,
    companyName,
    jobTitle,
  });
};

/**
 * Schedule application update notification
 */
export const scheduleApplicationUpdateNotification = async (
  status: string,
  jobTitle: string,
  companyName: string,
  applicationId: string
): Promise<string | null> => {
  const title = '📋 Application Update';
  const body = `Your application for ${jobTitle} at ${companyName} is now: ${status}`;

  return sendImmediateNotification(title, body, {
    type: 'application_update',
    applicationId,
    priority: 'normal',
    status,
    jobTitle,
    companyName,
  });
};

/**
 * Schedule weekly digest notification
 */
export const scheduleWeeklyDigest = async (
  newJobsCount: number,
  newMatchesCount: number
): Promise<string | null> => {
  const title = '📊 Weekly Job Digest';
  const body = `This week: ${newJobsCount} new jobs, ${newMatchesCount} new matches for you!`;

  // Schedule for next Sunday at 9 AM
  const nextSunday = new Date();
  nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()));
  nextSunday.setHours(9, 0, 0, 0);

  return scheduleNotification({
    title,
    body,
    data: {
      type: 'weekly_digest',
      priority: 'low',
      newJobsCount,
      newMatchesCount,
    },
    scheduledTime: nextSunday,
  });
};

/**
 * Handle notification received while app is in foreground
 */
export const handleForegroundNotification = (
  notification: Notifications.Notification
): void => {
  console.log('Foreground notification received:', notification);
  
  // You can add custom logic here based on notification type
  const notificationData = notification.request.content.data as NotificationData;
  
  switch (notificationData.type) {
    case 'job_match':
      // Could show in-app alert or update UI
      break;
    case 'application_update':
      // Could refresh application status
      break;
    default:
      break;
  }
};

/**
 * Handle notification tap/interaction
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse
): void => {
  console.log('Notification response received:', response);
  
  const notificationData = response.notification.request.content.data as NotificationData;
  
  // Handle navigation based on notification type
  switch (notificationData.type) {
    case 'job_match':
      if (notificationData.jobId) {
        // Navigate to job details
        console.log('Navigate to job:', notificationData.jobId);
      }
      break;
    case 'application_update':
      if (notificationData.applicationId) {
        // Navigate to application status
        console.log('Navigate to application:', notificationData.applicationId);
      }
      break;
    default:
      break;
  }
};

/**
 * Initialize notification service
 * Call this in your App.tsx or main component
 */
export const initializeNotificationService = async (): Promise<(() => void) | undefined> => {
  try {
    // Register for push notifications
    await registerForPushNotifications();
    
    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      handleForegroundNotification
    );
    
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    
    // Store listeners for cleanup (you might want to do this in your main component)
    console.log('Notification service initialized');
    
    // Return cleanup function
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  } catch (error) {
    console.error('Error initializing notification service:', error);
    return undefined;
  }
};