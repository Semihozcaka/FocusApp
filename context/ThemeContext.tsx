import React, { useState } from 'react';

export type Theme = {
  background: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  tabBar: string;
  border: string;
  buttonSecondaryBg: string;
  buttonSecondaryBorder: string;
};

export const DarkTheme: Theme = {
  background: '#050816',
  card: '#0f172a',
  text: '#f9fafb',
  muted: '#9ca3af',
  accent: '#22c55e',
  tabBar: '#050816',
  border: '#111827',
  buttonSecondaryBg: 'transparent',
  buttonSecondaryBorder: '#6b7280',
};

export const LightTheme: Theme = {
  background: '#f9fafb',
  card: '#e5e7eb',
  text: '#020617',
  muted: '#4b5563',
  accent: '#f97316',
  tabBar: '#f3f4f6',
  border: '#e5e7eb',
  buttonSecondaryBg: 'transparent',
  buttonSecondaryBorder: '#9ca3af',
};

export const ThemeContext = React.createContext<{
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
} | null>({
  theme: DarkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DarkTheme : LightTheme;
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
