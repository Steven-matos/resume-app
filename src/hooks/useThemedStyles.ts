import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme, useThemeColors, useThemeShadows } from '../contexts/ThemeContext';

/**
 * Custom hook that creates themed styles
 * Provides easy access to theme-aware styles without repetitive color definitions
 */
export function useThemedStyles<T>(
  createStyles: (colors: ReturnType<typeof useThemeColors>, isDark: boolean) => T
): T {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  return useMemo(() => createStyles(colors, isDark), [colors, isDark]);
}

/**
 * Common themed styles that can be reused across components
 * Updated with modern design patterns and improved visual hierarchy
 */
export function useCommonThemedStyles() {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const shadows = useThemeShadows();

  return useMemo(() => StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    secondaryContainer: {
      backgroundColor: colors.secondaryBackground,
    },
    
    groupedContainer: {
      backgroundColor: colors.groupedBackground,
    },
    
    // Modern card styles with proper shadows
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 6,
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.cardBorder,
      ...shadows.cardShadow,
    },
    
    compactCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 12,
      marginVertical: 4,
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.cardBorder,
      ...shadows.buttonShadow,
    },
    
    // Text styles with proper hierarchy
    largeTitle: {
      color: colors.label,
      fontSize: 34,
      fontWeight: 'bold',
      lineHeight: 41,
    },
    
    title1: {
      color: colors.label,
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 34,
    },
    
    title2: {
      color: colors.label,
      fontSize: 22,
      fontWeight: 'bold',
      lineHeight: 28,
    },
    
    title3: {
      color: colors.label,
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 25,
    },
    
    headline: {
      color: colors.label,
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
    },
    
    body: {
      color: colors.label,
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
    
    callout: {
      color: colors.label,
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 21,
    },
    
    subheadline: {
      color: colors.secondaryLabel,
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 20,
    },
    
    footnote: {
      color: colors.secondaryLabel,
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
    },
    
    caption1: {
      color: colors.tertiaryLabel,
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    
    caption2: {
      color: colors.tertiaryLabel,
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 13,
    },
    
    // Modern button styles
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      ...shadows.buttonShadow,
    },
    
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
    },
    
    secondaryButton: {
      backgroundColor: colors.secondaryFill,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    
    secondaryButtonText: {
      color: colors.accent,
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
    },
    
    tertiaryButton: {
      backgroundColor: 'transparent',
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    
    tertiaryButtonText: {
      color: colors.accent,
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 22,
    },
    
    destructiveButton: {
      backgroundColor: colors.destructive,
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      ...shadows.buttonShadow,
    },
    
    destructiveButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
    },
    
    // Modern input styles
    textInput: {
      backgroundColor: colors.tertiaryBackground,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 17,
      color: colors.label,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      minHeight: 44,
    },
    
    focusedTextInput: {
      backgroundColor: colors.tertiaryBackground,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 17,
      color: colors.label,
      borderWidth: 2,
      borderColor: colors.focusedBorder,
      minHeight: 44,
    },
    
    // List and section styles
    listSection: {
      backgroundColor: colors.groupedSecondaryBackground,
      borderRadius: 10,
      marginVertical: 8,
      overflow: 'hidden',
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.separator,
    },
    
    listItem: {
      backgroundColor: colors.groupedSecondaryBackground,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    lastListItem: {
      borderBottomWidth: 0,
    },
    
    // Dividers and separators
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    
    thickSeparator: {
      height: 1,
      backgroundColor: colors.opaqueSeparator,
    },
    
    sectionSeparator: {
      height: 8,
      backgroundColor: colors.groupedBackground,
    },
    
    // Icon containers
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.tertiaryFill,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    
    // Status indicators
    badge: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    badgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
    },
  }), [colors, shadows, isDark]);
}