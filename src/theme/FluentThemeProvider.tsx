// Wraps the app in FluentProvider with the brand theme from the environment variables (spec section 7).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { FluentProvider, makeStyles } from '@fluentui/react-components';
import { COLOR_SCHEME_STORAGE_KEY, THEME_VARIABLES } from '../config';
import { getTheme } from '../data/dataService';
import { buildThemeColors } from '../data/theme';
import type { ThemeValues } from '../data/types';
import { buildBrandRamp, buildThemes, flattenOnWhite, whiteTextFailures } from './brandRamp';

export type ColorScheme = 'light' | 'dark';

interface ThemeModeContextValue {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const FALLBACK_VALUES = Object.fromEntries(
  Object.entries(THEME_VARIABLES).map(([key, { fallback }]) => [key, fallback])
) as unknown as ThemeValues;

const useStyles = makeStyles({
  root: { minHeight: '100dvh' },
});

function readStoredScheme(): ColorScheme {
  try {
    return window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function storeScheme(scheme: ColorScheme): void {
  try {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  } catch {
    // Storage blocked (private window, policy): the choice just isn't remembered.
  }
}

export function FluentThemeProvider({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const [values, setValues] = useState<ThemeValues>(FALLBACK_VALUES);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(readStoredScheme);

  useEffect(() => {
    getTheme()
      .then((theme) => setValues(theme.values))
      .catch((error: unknown) => {
        // The spec's fallback chain covers missing values; a failed query keeps the fallback theme.
        console.error('Theme variables could not be loaded; using fallback theme.', error);
      });
  }, []);

  const { themes, cssVariables } = useMemo(() => {
    const brand = buildBrandRamp(flattenOnWhite(values));
    const failures = whiteTextFailures(brand);
    if (failures.length > 0) console.warn('Brand shades failing WCAG AA with white text:', failures);
    const colors = buildThemeColors(values);
    const vars = { '--tm-main': colors.main, '--tm-light': colors.light, '--tm-medium': colors.medium } as CSSProperties;
    return { themes: buildThemes(brand), cssVariables: vars };
  }, [values]);

  const toggleColorScheme = useCallback(() => {
    setColorScheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      storeScheme(next);
      return next;
    });
  }, []);

  const modeValue = useMemo(() => ({ colorScheme, toggleColorScheme }), [colorScheme, toggleColorScheme]);

  return (
    <ThemeModeContext.Provider value={modeValue}>
      <FluentProvider theme={themes[colorScheme]} style={cssVariables} className={styles.root}>
        {children}
      </FluentProvider>
    </ThemeModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode(): ThemeModeContextValue {
  const value = useContext(ThemeModeContext);
  if (!value) throw new Error('useThemeMode must be used inside FluentThemeProvider');
  return value;
}
