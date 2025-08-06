import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  scheduleJobMatchNotification,
  scheduleApplicationUpdateNotification,
  scheduleWeeklyDigest,
  sendImmediateNotification,
  cancelAllNotifications,
} from '../utils/notificationService';

/**
 * NotificationDemo component
 * Demonstrates how to use the notification service
 * This component can be integrated into any screen for testing notifications
 */
export default function NotificationDemo() {
  /**
   * Test job match notification
   */
  const testJobMatchNotification = async () => {
    try {
      const notificationId = await scheduleJobMatchNotification(
        'Senior React Native Developer',
        'TechCorp Inc.',
        'job123',
        92
      );
      
      if (notificationId) {
        Alert.alert('Success', 'Job match notification scheduled!');
      } else {
        Alert.alert('Info', 'Notification not scheduled (may be disabled or in quiet hours)');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule job match notification');
    }
  };

  /**
   * Test application update notification
   */
  const testApplicationUpdateNotification = async () => {
    try {
      const notificationId = await scheduleApplicationUpdateNotification(
        'Interview Scheduled',
        'Senior React Native Developer',
        'TechCorp Inc.',
        'app456'
      );
      
      if (notificationId) {
        Alert.alert('Success', 'Application update notification scheduled!');
      } else {
        Alert.alert('Info', 'Notification not scheduled (may be disabled or in quiet hours)');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule application update notification');
    }
  };

  /**
   * Test weekly digest notification
   */
  const testWeeklyDigestNotification = async () => {
    try {
      const notificationId = await scheduleWeeklyDigest(25, 8);
      
      if (notificationId) {
        Alert.alert('Success', 'Weekly digest notification scheduled for next Sunday!');
      } else {
        Alert.alert('Info', 'Notification not scheduled (may be disabled)');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule weekly digest notification');
    }
  };

  /**
   * Test immediate notification
   */
  const testImmediateNotification = async () => {
    try {
      const notificationId = await sendImmediateNotification(
        '🎉 Test Notification',
        'This is a test notification from your Resume App!',
        {
          type: 'system',
          priority: 'normal',
          testData: 'This is test data',
        }
      );
      
      if (notificationId) {
        Alert.alert('Success', 'Immediate notification sent!');
      } else {
        Alert.alert('Info', 'Notification not sent (may be disabled or in quiet hours)');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send immediate notification');
    }
  };

  /**
   * Clear all scheduled notifications
   */
  const clearAllScheduledNotifications = async () => {
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
              await cancelAllNotifications();
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
   * Render demo button
   */
  const renderDemoButton = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    color = '#007AFF'
  ) => (
    <TouchableOpacity
      style={[styles.demoButton, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.buttonIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.buttonContent}>
        <Text style={styles.buttonTitle}>{title}</Text>
        <Text style={styles.buttonSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notification Testing</Text>
      <Text style={styles.sectionSubtitle}>
        Test different types of notifications to see how they work
      </Text>

      <View style={styles.demoSection}>
        {renderDemoButton(
          'Job Match Alert',
          'Test a high-priority job match notification',
          'briefcase',
          testJobMatchNotification,
          '#34C759'
        )}

        {renderDemoButton(
          'Application Update',
          'Test an application status update',
          'document-text',
          testApplicationUpdateNotification,
          '#007AFF'
        )}

        {renderDemoButton(
          'Weekly Digest',
          'Schedule a weekly summary notification',
          'calendar',
          testWeeklyDigestNotification,
          '#FF9500'
        )}

        {renderDemoButton(
          'Immediate Test',
          'Send a test notification right now',
          'flash',
          testImmediateNotification,
          '#5856D6'
        )}

        {renderDemoButton(
          'Clear All',
          'Cancel all scheduled notifications',
          'trash',
          clearAllScheduledNotifications,
          '#FF3B30'
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          Notifications respect your settings and quiet hours. If a notification doesn't appear, 
          check your notification settings or try again outside of quiet hours.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 20,
  },
  demoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderLeftWidth: 4,
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});