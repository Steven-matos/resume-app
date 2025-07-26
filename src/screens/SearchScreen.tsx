import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

/**
 * SearchScreen component
 * Provides job search functionality with filters and recent searches
 */
export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  /**
   * Mock recent searches data
   */
  const recentSearches = [
    'Software Engineer',
    'React Native Developer',
    'Product Manager',
    'UX Designer',
  ];

  /**
   * Mock job categories
   */
  const categories = [
    { id: 'all', label: 'All Jobs' },
    { id: 'tech', label: 'Technology' },
    { id: 'design', label: 'Design' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'sales', label: 'Sales' },
  ];

  /**
   * Handles search submission
   */
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        // Perform job search
        Alert.alert('Search', `Searching for "${searchQuery}"`);
        console.log('Searching for:', searchQuery);
        
        // In a real implementation, this would navigate to JobsScreen with search results
        // navigation.navigate('Jobs', { searchQuery });
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  };

  /**
   * Renders category button
   */
  const renderCategoryButton = (category: { id: string; label: string }) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.categoryButtonTextActive
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  );

  /**
   * Renders recent search item
   */
  const renderRecentSearch = (search: string) => (
    <TouchableOpacity
      key={search}
      style={styles.recentSearchItem}
      onPress={() => setSearchQuery(search)}
      activeOpacity={0.8}
    >
      <Ionicons name="time-outline" size={16} color="#8E8E93" />
      <Text style={styles.recentSearchText}>{search}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search Jobs</Text>
          <Text style={styles.headerSubtitle}>
            Find your perfect opportunity
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs, companies, or keywords..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            activeOpacity={0.8}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryButton)}
          </View>
        </View>

        {/* Recent Searches */}
        <View style={styles.recentSearchesSection}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.recentSearchesContainer}>
            {recentSearches.map(renderRecentSearch)}
          </View>
        </View>

        {/* Popular Searches */}
        <View style={styles.popularSearchesSection}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.popularSearchesContainer}>
            <TouchableOpacity style={styles.popularSearchItem}>
              <Text style={styles.popularSearchText}>Remote Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popularSearchItem}>
              <Text style={styles.popularSearchText}>Entry Level</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popularSearchItem}>
              <Text style={styles.popularSearchText}>Senior Level</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popularSearchItem}>
              <Text style={styles.popularSearchText}>Startup Jobs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 12,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  recentSearchesSection: {
    marginBottom: 24,
  },
  recentSearchesContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
  },
  popularSearchesSection: {
    marginBottom: 24,
  },
  popularSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularSearchItem: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularSearchText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
}); 