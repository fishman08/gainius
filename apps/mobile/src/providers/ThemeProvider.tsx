import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { lightTheme, darkTheme } from '@fitness-tracker/shared';
import type { Theme, ThemeMode } from '@fitness-tracker/shared';

const THEME_STORAGE_KEY = 'theme-mode';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  themeMode: 'system',
  setThemeMode: () => {},
});

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  const paperTheme = useMemo(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;
    const bodyFont = { fontFamily: 'RethinkSans_400Regular' };
    const displayFont = { fontFamily: 'BarlowCondensed_700Bold' };
    const headlineFont = { fontFamily: 'BarlowCondensed_600SemiBold' };
    return {
      ...base,
      fonts: configureFonts({
        config: {
          ...bodyFont,
          displayLarge: { ...displayFont },
          displayMedium: { ...displayFont },
          displaySmall: { ...displayFont },
          headlineLarge: { ...headlineFont },
          headlineMedium: { ...headlineFont },
          headlineSmall: { ...headlineFont },
          titleLarge: { fontFamily: 'RethinkSans_600SemiBold' },
          titleMedium: { fontFamily: 'RethinkSans_500Medium' },
          titleSmall: { fontFamily: 'RethinkSans_500Medium' },
          labelLarge: { fontFamily: 'RethinkSans_500Medium' },
          labelMedium: { fontFamily: 'RethinkSans_500Medium' },
          labelSmall: { fontFamily: 'RethinkSans_500Medium' },
          bodyLarge: { ...bodyFont },
          bodyMedium: { ...bodyFont },
          bodySmall: { ...bodyFont },
        },
      }),
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        surface: theme.colors.surface,
        error: theme.colors.error,
        onSurface: theme.colors.text,
        onSurfaceVariant: theme.colors.textSecondary,
        outline: theme.colors.surfaceBorder,
        primaryContainer: theme.colors.primaryMuted,
        onPrimary: theme.colors.primaryText,
      },
    };
  }, [isDark, theme]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}
