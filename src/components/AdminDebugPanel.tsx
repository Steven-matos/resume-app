import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobApiService } from '../utils/jobApi';

/**
 * AdminDebugPanel component
 * ADMIN ONLY: Shows API usage statistics for development and monitoring
 * This component should only be visible in development mode
 */
export default function AdminDebugPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  if (!__DEV__) {
    return null;
  }

  /**
   * Load admin statistics
   */
  const loadStats = async () => {
    try {
      setLoading(true);
      const adminStats = await jobApiService._getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.warn('[ADMIN] Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear cache (admin only)
   */
  const handleClearCache = () => {
    Alert.alert(
      '[ADMIN] Clear Cache',
      'This will remove all cached job data across the entire app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobApiService._clearCacheAdmin();
              Alert.alert('[ADMIN] Success', 'Cache cleared successfully');
              loadStats();
            } catch (error) {
              Alert.alert('[ADMIN] Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (isVisible) {
      loadStats();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleButtonText}>🔧 Admin</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="construct-outline" size={20} color="#FF9500" />
          <Text style={styles.title}>Admin Debug Panel</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Loading admin stats...</Text>
      ) : stats ? (
        <>
          {/* API Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.label}>JSearch API Key:</Text>
              <Text style={[styles.value, stats.hasApiKey ? styles.success : styles.error]}>
                {stats.hasApiKey ? 'Configured' : 'Missing'}
              </Text>
            </View>
          </View>

          {/* Request Usage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App-Wide Request Usage</Text>
            <View style={styles.usageContainer}>
              <View style={styles.usageBar}>
                <View 
                  style={[
                    styles.usageFill, 
                    { width: `${Math.min((stats.requests.used / 200) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <View style={styles.usageStats}>
                <Text style={styles.usageText}>
                  {stats.requests.used} / 200 requests used
                </Text>
                <Text style={styles.remainingText}>
                  {stats.requests.remaining} remaining
                </Text>
              </View>
            </View>
            <Text style={styles.resetText}>
              Resets on {stats.requests.resetDate}
            </Text>
          </View>

          {/* Cache Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cache Statistics</Text>
            <View style={styles.cacheItem}>
              <Text style={styles.label}>Cached Searches:</Text>
              <Text style={styles.value}>{stats.cache.totalEntries}</Text>
            </View>
            <View style={styles.cacheItem}>
              <Text style={styles.label}>Cache Size:</Text>
              <Text style={styles.value}>
                {(stats.cache.totalSize / 1024).toFixed(1)} KB
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCache}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear App Cache</Text>
            </TouchableOpacity>
          </View>

          {/* Warning */}
          <View style={styles.warningSection}>
            <Text style={styles.warningText}>
              ⚠️ This panel is only visible in development mode and shows app-wide statistics.
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.errorText}>Failed to load admin stats</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 1000,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF9500',
    zIndex: 999,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  usageContainer: {
    marginBottom: 8,
  },
  usageBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageFill: {
    height: '100%',
    backgroundColor: '#FF9500',
    borderRadius: 4,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  remainingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  resetText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cacheItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
  },
  warningSection: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
}); 