import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  /** Current theme mode setting */
  themeMode: ThemeMode;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Set the theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark mode */
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';

/**
 * ThemeProvider - Manages global theme state and persistence
 * Supports light, dark, and system theme modes with AsyncStorage persistence
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Calculate if dark mode should be active
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  /**
   * Load saved theme preference from AsyncStorage
   */
  useEffect(() => {
    loadThemePreference();
  }, []);

  /**
   * Load theme preference from storage
   */
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save theme preference to storage
   */
  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  /**
   * Set theme mode and persist to storage
   */
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveThemePreference(mode);
  };

  /**
   * Toggle between light and dark mode
   * If currently on system, switch to opposite of current system theme
   */
  const toggleTheme = () => {
    if (themeMode === 'system') {
      // If on system mode, switch to opposite of current system theme
      const newMode = systemColorScheme === 'dark' ? 'light' : 'dark';
      setThemeMode(newMode);
    } else {
      // Toggle between light and dark
      const newMode = themeMode === 'light' ? 'dark' : 'light';
      setThemeMode(newMode);
    }
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  const value: ThemeContextType = {
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme context
 * @returns ThemeContextType
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get current theme colors
 * Modern iOS-style color system with proper contrast and accessibility
 * @returns Object with theme-aware colors
 */
export function useThemeColors() {
  const { isDark } = useTheme();
  
  return {
    // Background colors - Modern iOS hierarchy
    background: isDark ? '#000000' : '#F2F2F7',           // Primary background
    secondaryBackground: isDark ? '#1C1C1E' : '#FFFFFF',  // Cards, modals
    tertiaryBackground: isDark ? '#2C2C2E' : '#F2F2F7',   // Input fields, secondary cards
    quaternaryBackground: isDark ? '#3A3A3C' : '#E5E5EA', // Disabled states
    
    // Grouped background colors (for settings-style lists)
    groupedBackground: isDark ? '#000000' : '#F2F2F7',
    groupedSecondaryBackground: isDark ? '#1C1C1E' : '#FFFFFF',
    groupedTertiaryBackground: isDark ? '#2C2C2E' : '#F2F2F7',
    
    // Text colors - Improved contrast and hierarchy
    primary: isDark ? '#FFFFFF' : '#000000',              // Primary text
    secondary: isDark ? '#EBEBF5' : '#3C3C43',           // Secondary text (better contrast)
    tertiary: isDark ? '#EBEBF599' : '#3C3C4399',        // Tertiary text (60% opacity)
    quaternary: isDark ? '#EBEBF54D' : '#3C3C434D',      // Quaternary text (30% opacity)
    placeholder: isDark ? '#EBEBF54D' : '#3C3C434D',     // Placeholder text
    
    // Label colors (semantic text colors)
    label: isDark ? '#FFFFFF' : '#000000',
    secondaryLabel: isDark ? '#EBEBF599' : '#3C3C4399',
    tertiaryLabel: isDark ? '#EBEBF54D' : '#3C3C434D',
    quaternaryLabel: isDark ? '#EBEBF52E' : '#3C3C432E',
    
    // Accent colors - System colors that adapt to theme
    accent: isDark ? '#0A84FF' : '#007AFF',               // Blue
    destructive: isDark ? '#FF453A' : '#FF3B30',         // Red
    success: isDark ? '#32D74B' : '#34C759',             // Green
    warning: isDark ? '#FFD60A' : '#FF9500',             // Orange/Yellow
    purple: isDark ? '#BF5AF2' : '#AF52DE',              // Purple
    pink: isDark ? '#FF2D92' : '#FF2D92',                // Pink
    indigo: isDark ? '#5E5CE6' : '#5856D6',              // Indigo
    teal: isDark ? '#40E0D0' : '#5AC8FA',                // Teal
    
    // Fill colors (for buttons and interactive elements)
    fill: isDark ? '#787880' : '#78788033',              // Primary fill
    secondaryFill: isDark ? '#78788052' : '#78788028',   // Secondary fill
    tertiaryFill: isDark ? '#7878803D' : '#7878801E',    // Tertiary fill
    quaternaryFill: isDark ? '#78788029' : '#78788014',  // Quaternary fill
    
    // Border and separator colors
    separator: isDark ? '#38383A' : '#C6C6C8',           // Separators
    opaqueSeparator: isDark ? '#38383A' : '#C6C6C8',     // Opaque separators
    link: isDark ? '#0A84FF' : '#007AFF',                // Links
    
    // Modern border colors with better visibility
    border: isDark ? '#38383A' : '#C6C6C8',              // Standard borders
    focusedBorder: isDark ? '#0A84FF' : '#007AFF',       // Focused input borders
    
    // Card and elevation colors
    cardBackground: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBorder: isDark ? '#38383A' : '#E5E5EA',
    
    // Navigation colors
    navigationBackground: isDark ? '#1C1C1E' : '#F9F9F9',
    tabBarBackground: isDark ? '#1C1C1E' : '#F9F9F9',
    tabBarBorder: isDark ? '#38383A' : '#E5E5EA',
    
    // Status colors with better contrast
    online: isDark ? '#32D74B' : '#34C759',
    offline: isDark ? '#8E8E93' : '#8E8E93',
    away: isDark ? '#FFD60A' : '#FF9500',
    busy: isDark ? '#FF453A' : '#FF3B30',
    
    // Overlay colors
    overlay: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.4)',
    modalBackground: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)',
  };
}

/**
 * Hook to get shadow styles that adapt to theme
 * @returns Object with theme-appropriate shadow styles
 */
export function useThemeShadows() {
  const { isDark } = useTheme();
  
  return {
    // Card shadows
    cardShadow: {
      shadowColor: isDark ? '#000000' : '#000000',
      shadowOffset: {
        width: 0,
        height: isDark ? 4 : 2,
      },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: isDark ? 8 : 4,
      elevation: isDark ? 8 : 2,
    },
    
    // Button shadows
    buttonShadow: {
      shadowColor: isDark ? '#000000' : '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: isDark ? 4 : 1,
    },
    
    // Header shadows
    headerShadow: {
      shadowColor: isDark ? '#000000' : '#000000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 2,
      elevation: isDark ? 3 : 1,
    },
  };
}