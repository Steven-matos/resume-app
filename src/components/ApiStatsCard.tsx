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
 * API usage statistics interface
 */
interface ApiStats {
  requests: {
    used: number;
    remaining: number;
    resetDate: string;
  };
  cache: {
    totalEntries: number;
    totalSize: number;
  };
  hasApiKey: boolean;
}

/**
 * ApiStatsCard component
 * Displays API usage statistics and cache information
 */
export default function ApiStatsCard() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load API statistics
   */
  const loadStats = async () => {
    try {
      setLoading(true);
      const apiStats = await jobApiService.getApiStats();
      setStats(apiStats);
    } catch (error) {
      console.warn('Failed to load API stats:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear cache with confirmation
   */
  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached job data. Cached searches will need to be re-fetched from the API.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobApiService.clearCache();
              Alert.alert('Success', 'Cache cleared successfully');
              loadStats(); // Reload stats
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading API stats...</Text>
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  const { requests, cache, hasApiKey } = stats;
  const usagePercentage = (requests.used / 200) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics-outline" size={20} color="#007AFF" />
        <Text style={styles.title}>API Usage</Text>
      </View>

      {/* API Key Status */}
      <View style={styles.section}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>API Key:</Text>
          <View style={[styles.status, hasApiKey ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, hasApiKey ? styles.statusTextActive : styles.statusTextInactive]}>
              {hasApiKey ? 'Connected' : 'Not Configured'}
            </Text>
          </View>
        </View>
      </View>

      {/* Request Usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Requests</Text>
        <View style={styles.usageContainer}>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageFill, 
                { width: `${Math.min(usagePercentage, 100)}%` }
              ]} 
            />
          </View>
          <View style={styles.usageStats}>
            <Text style={styles.usageText}>
              {requests.used} / 200 used
            </Text>
            <Text style={styles.remainingText}>
              {requests.remaining} remaining
            </Text>
          </View>
        </View>
        <Text style={styles.resetText}>
          Resets on {requests.resetDate}
        </Text>
      </View>

      {/* Cache Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache</Text>
        <View style={styles.cacheStats}>
          <View style={styles.cacheItem}>
            <Text style={styles.cacheLabel}>Cached Searches:</Text>
            <Text style={styles.cacheValue}>{cache.totalEntries}</Text>
          </View>
          <View style={styles.cacheItem}>
            <Text style={styles.cacheLabel}>Cache Size:</Text>
            <Text style={styles.cacheValue}>
              {(cache.totalSize / 1024).toFixed(1)} KB
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCache}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={styles.clearButtonText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips to Save Requests:</Text>
        <Text style={styles.tipText}>• Searches are cached for 24 hours</Text>
        <Text style={styles.tipText}>• Use specific job titles for better results</Text>
        <Text style={styles.tipText}>• Add location to reduce duplicate searches</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
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
  status: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D4EDDA',
  },
  statusInactive: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#155724',
  },
  statusTextInactive: {
    color: '#721C24',
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
    backgroundColor: '#007AFF',
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
  cacheStats: {
    marginBottom: 12,
  },
  cacheItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cacheLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cacheValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
  },
  tipsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 2,
  },
}); 