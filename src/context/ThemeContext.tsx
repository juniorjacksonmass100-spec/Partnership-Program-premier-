import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The system is styled exclusively in the requested subtle purple dark mode
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    try {
      localStorage.setItem('jm_theme', 'dark');
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    // Locked to subtle purple dark mode per specification
  };

  const setTheme = () => {
    // Locked to subtle purple dark mode per specification
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme lazima itumike ndani ya ThemeProvider');
  }
  return context;
};
