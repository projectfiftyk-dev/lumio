import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface AppContextValue {
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setEditMode] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('lumio-theme') as Theme) ?? 'light';
  });

  useEffect(() => {
    localStorage.setItem('lumio-theme', theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return (
    <AppContext.Provider value={{ isEditMode, setEditMode, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
