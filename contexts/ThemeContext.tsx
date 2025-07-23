import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    accent: string;
    shadow: string;
    overlay: string;
    tabBar: string;
    tabBarBorder: string;
    modalOverlay: string;
  };
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: {
    primary: '#6366F1',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    accent: '#6366F1',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    primary: '#818CF8',
    background: '#000000', // AMOLED Black
    surface: '#111111',    // Very dark gray for cards
    card: '#1A1A1A',      // Slightly lighter for elevated cards
    text: '#FFFFFF',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    border: '#374151',
    borderLight: '#2D3748',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    accent: '#818CF8',
    shadow: '#000000',
    overlay: 'rgba(0, 0, 0, 0.8)',
    tabBar: '#111111',
    tabBarBorder: '#374151',
    modalOverlay: 'rgba(0, 0, 0, 0.9)',
  },
  isDark: true,
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeMode: 'system',
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Simple theme mode setter (no persistence for now)
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Determine current theme based on mode and system preference
  const getCurrentTheme = (): Theme => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getCurrentTheme();

  const value: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};