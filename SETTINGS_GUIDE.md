# Settings and Notification System Guide

## Overview

This guide covers the comprehensive settings and notification system implemented for your Resume App. The system includes user preferences, notification management, and a robust notification service.

## Features Implemented

### 🔧 Settings Screen (`src/screens/SettingsScreen.tsx`)

**Notification Settings:**
- Push notification toggle
- Job alerts management
- Email notification preferences
- Notification settings navigation

**App Preferences:**
- Dark mode toggle
- Sound effects control
- Vibration settings
- Auto-save functionality

**Data & Privacy:**
- Data usage preferences (WiFi/Cellular/Both)
- Language selection
- Clear app data functionality

**About Section:**
- Privacy policy access
- Terms of service
- Help & support
- App version information

### 🔔 Notification Settings Screen (`src/screens/NotificationSettingsScreen.tsx`)

**Permission Management:**
- Real-time permission status display
- Permission request handling
- Settings navigation for denied permissions

**Notification Types:**
- Job matches
- Application updates
- Weekly digest
- Marketing emails

**Notification Behavior:**
- Instant alerts toggle
- Sound preferences
- Vibration control
- Badge count management
- Preview settings

**Quiet Hours:**
- Enable/disable quiet hours
- Customizable start and end times
- Smart scheduling around quiet periods

**Testing & Management:**
- Send test notifications
- Clear all scheduled notifications
- Debug information (development mode)

### 🔧 Notification Service (`src/utils/notificationService.ts`)

**Core Functionality:**
- Expo push token registration
- Android notification channels setup
- Permission management
- Settings-aware notification scheduling

**Notification Types:**
- Job match alerts (high priority)
- Application updates (normal priority)
- Weekly digest (low priority)
- Marketing notifications (low priority)
- System notifications (high priority)

**Smart Features:**
- Quiet hours respect
- User preference checking
- Priority-based delivery
- Recurring notifications support

## Usage Examples

### Basic Notification Scheduling

```typescript
import { scheduleJobMatchNotification } from '../utils/notificationService';

// Schedule a job match notification
const notificationId = await scheduleJobMatchNotification(
  'Senior React Native Developer',
  'TechCorp Inc.',
  'job123',
  92 // match percentage
);
```

### Application Update Notification

```typescript
import { scheduleApplicationUpdateNotification } from '../utils/notificationService';

// Notify about application status change
const notificationId = await scheduleApplicationUpdateNotification(
  'Interview Scheduled',
  'Senior React Native Developer',
  'TechCorp Inc.',
  'app456'
);
```

### Weekly Digest

```typescript
import { scheduleWeeklyDigest } from '../utils/notificationService';

// Schedule weekly summary
const notificationId = await scheduleWeeklyDigest(25, 8); // 25 new jobs, 8 matches
```

### Immediate Notification

```typescript
import { sendImmediateNotification } from '../utils/notificationService';

// Send immediate notification
const notificationId = await sendImmediateNotification(
  'Welcome!',
  'Your profile has been updated successfully.',
  {
    type: 'system',
    priority: 'normal',
  }
);
```

## Navigation Integration

The settings system is integrated into your existing navigation structure:

```typescript
// Navigation types updated in App.tsx
export type RootStackParamList = {
  MainTabs: undefined;
  UploadResume: undefined;
  JobDetails: { jobId: string };
  Settings: undefined;                    // New
  NotificationSettings: undefined;        // New
};
```

**Access Points:**
- Profile Screen → Settings menu item
- Profile Screen → Notifications menu item
- Settings Screen → Notification Settings

## Data Persistence

**Settings Storage:**
- App settings: `AsyncStorage.getItem('appSettings')`
- Notification settings: `AsyncStorage.getItem('notificationSettings')`
- Expo push token: `AsyncStorage.getItem('expoPushToken')`

**Settings Structure:**
```typescript
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
```

## Notification Channels (Android)

The system automatically creates these notification channels:

1. **Job Alerts** (`job_alerts`)
   - High priority
   - Vibration enabled
   - LED light enabled

2. **Application Updates** (`application_updates`)
   - Normal priority
   - Sound enabled

3. **Weekly Digest** (`weekly_digest`)
   - Low priority
   - Minimal interruption

4. **Marketing** (`marketing`)
   - Low priority
   - No sound/vibration

5. **System** (`system`)
   - High priority
   - For critical app notifications

## Testing Features

### Development Mode Demo

The `NotificationDemo` component (visible in ProfileScreen during development) provides:

- Test job match notifications
- Test application updates
- Schedule weekly digest
- Send immediate test notifications
- Clear all scheduled notifications

### Debug Information

In development mode, the notification settings screen shows:
- Current Expo push token
- Permission status
- Scheduled notification count

## Best Practices

### 1. Respect User Preferences
```typescript
// Always check if notifications are enabled
const notificationsEnabled = await areNotificationsEnabled();
if (!notificationsEnabled) return null;
```

### 2. Handle Quiet Hours
```typescript
// Check quiet hours for non-critical notifications
if (notification.data.priority !== 'critical') {
  const isQuietTime = await isQuietHoursActive();
  if (isQuietTime) return null;
}
```

### 3. Use Appropriate Priorities
- **Critical**: System errors, security alerts
- **High**: Job matches, interview invitations
- **Normal**: Application updates, profile changes
- **Low**: Weekly digests, marketing content

### 4. Provide Clear Controls
- Easy toggle switches for all notification types
- Granular control over notification behavior
- Clear explanations of what each setting does

## Error Handling

The system includes comprehensive error handling:

- Permission denial graceful handling
- Network failure recovery
- Storage error management
- Invalid notification data handling

## Future Enhancements

Potential improvements you could add:

1. **Advanced Scheduling**
   - Custom quiet hours per day
   - Holiday awareness
   - Timezone handling

2. **Rich Notifications**
   - Action buttons
   - Images and attachments
   - Progress indicators

3. **Analytics**
   - Notification open rates
   - User engagement tracking
   - A/B testing support

4. **Personalization**
   - Machine learning for optimal timing
   - Content personalization
   - Frequency optimization

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check device permissions
   - Verify notification settings in app
   - Check if quiet hours are active
   - Ensure physical device (not simulator)

2. **Permission denied**
   - Guide users to device settings
   - Explain why permissions are needed
   - Provide alternative communication methods

3. **Token registration fails**
   - Check Expo project configuration
   - Verify network connectivity
   - Ensure proper project ID setup

## Conclusion

This settings and notification system provides a comprehensive, user-friendly way to manage app preferences and notifications. It follows modern mobile app best practices and provides a solid foundation for future enhancements.

The system is designed to be:
- **User-centric**: Respects user preferences and privacy
- **Robust**: Handles errors gracefully
- **Extensible**: Easy to add new settings and notification types
- **Performant**: Efficient storage and minimal battery impact
- **Accessible**: Clear UI and helpful explanations