import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback, 
    useMemo,
    useRef,
    ReactNode,
    FC
  } from 'react';
  import { isRtlLang } from 'rtl-detect';
  
  const STORAGE_KEY = 'theme-preferences';
  const THEME = {
    LIGHT: 'light',
    DARK: 'dark'
  } as const;
  const DIRECTION = {
    LTR: 'ltr',
    RTL: 'rtl'
  } as const;
  const FONT_SCALE = {
    MIN: 0.8,
    MAX: 1.5,
    DEFAULT: 1
  } as const;
  
  type ThemeType = typeof THEME[keyof typeof THEME];
  type DirectionType = typeof DIRECTION[keyof typeof DIRECTION];
  
  const DEFAULT_PREFERENCES = {
    theme: THEME.DARK,
    fontScale: FONT_SCALE.DEFAULT,
    direction: DIRECTION.LTR
  };
  
  interface ThemeContextValue {
    theme: ThemeType;
    fontScale: number;
    direction: DirectionType;
    toggleTheme: () => void;
    changeFontScale: (scale: number) => void;
    toggleDirection: () => void;
    isLight: boolean;
    isDark: boolean;
    isRtl: boolean;
    isLtr: boolean;
  }

  const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
  
  const isBrowser = (): boolean => typeof window !== 'undefined';
  const isServer = (): boolean => typeof window === 'undefined';
  
  interface StorageValue {
    theme?: ThemeType;
    fontScale?: number;
    direction?: DirectionType;
    timestamp?: number;
    [key: string]: any;
  }

  const storage = {
    get: (key: string): StorageValue | null => {
      if (!isBrowser()) return null;
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn(`Failed to read from localStorage (${key}):`, error);
        return null;
      }
    },
    
    set: (key: string, value: StorageValue): boolean => {
      if (!isBrowser()) return false;
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Failed to write to localStorage (${key}):`, error);
        return false;
      }
    },
    
    remove: (key: string): void => {
      if (!isBrowser()) return;
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove from localStorage (${key}):`, error);
      }
    }
  };
  
  const getBrowserTheme = (): ThemeType => {
    if (!isBrowser()) return THEME.DARK;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    return mediaQuery.matches ? THEME.LIGHT : THEME.DARK;
  };
  
  const getLanguageDirection = (): DirectionType => {
    if (!isBrowser()) return DIRECTION.LTR;
    try {
      return isRtlLang(navigator.language) ? DIRECTION.RTL : DIRECTION.LTR;
    } catch (error) {
      console.warn('Failed to detect language direction:', error);
      return DIRECTION.LTR;
    }
  };
  
  interface ThemeProviderProps {
    children: ReactNode;
  }

  export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
    const pageRef = useRef<HTMLElement>(null);
    const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Page element referencia inicializálása
    useEffect(() => {
      if (isBrowser()) {
        pageRef.current = document.documentElement;
      }
    }, []);
  
    // Mentett preferenciák betöltése (csak egyszer)
    const persistedPreferences = useMemo(() => {
      if (isServer()) return {};
      return storage.get(STORAGE_KEY) || {};
    }, []);
  
    // Kezdeti téma meghatározása
    const initialTheme = useMemo(() => {
      if (isServer()) return THEME.DARK;
      return persistedPreferences.theme || getBrowserTheme();
    }, [persistedPreferences.theme]);
  
    // Kezdeti szövegirány meghatározása
    const initialDirection = useMemo(() => {
      if (isServer()) return DIRECTION.LTR;
      return persistedPreferences.direction || getLanguageDirection();
    }, [persistedPreferences.direction]);
  
    // State-ek
    const [theme, setTheme] = useState(initialTheme);
    const [fontScale, setFontScale] = useState(
      persistedPreferences.fontScale || FONT_SCALE.DEFAULT
    );
    const [direction, setDirection] = useState(initialDirection);
  
    const stopTransition = useCallback((): void => {
      if (!pageRef.current) return;
      
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      pageRef.current.classList.add('no-transition');
      
      transitionTimeoutRef.current = setTimeout(() => {
        if (pageRef.current) {
          pageRef.current.classList.remove('no-transition');
        }
      }, 100);
    }, []);
  
    const savePreferences = useCallback((): void => {
      storage.set(STORAGE_KEY, {
        theme,
        fontScale,
        direction,
        timestamp: Date.now()
      });
    }, [theme, fontScale, direction]);
  
    const toggleTheme = useCallback((): void => {
      setTheme(prev => prev === THEME.LIGHT ? THEME.DARK : THEME.LIGHT);
      stopTransition();
    }, [stopTransition]);
  
    const changeFontScale = useCallback((scale: number): void => {
      const validatedScale = Math.max(
        FONT_SCALE.MIN, 
        Math.min(FONT_SCALE.MAX, scale)
      );
      setFontScale(validatedScale);
      stopTransition();
    }, [stopTransition]);
  
    const toggleDirection = useCallback((): void => {
      setDirection(prev => prev === DIRECTION.LTR ? DIRECTION.RTL : DIRECTION.LTR);
    }, []);
  
    /**
     * CSS custom properties és attribútumok alkalmazása
     */
    useEffect(() => {
      const page = pageRef.current;
      if (!page) return;
  
      // CSS változók beállítása
      page.style.setProperty('--font-scale', fontScale.toString());
      page.style.setProperty(
        '--widget-scale', 
        fontScale === 1 ? '0px' : `${fontScale * 3}px`
      );
      
      // Dir attribútum beállítása
      page.setAttribute('dir', direction);
      
      // Preferenciák mentése
      savePreferences();
    }, [fontScale, direction, savePreferences]);
  
    useEffect(() => {
      if (isServer() || persistedPreferences.theme) return;
  
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      
      const handleChange = (event: MediaQueryListEvent): void => {
        setTheme(event.matches ? THEME.LIGHT : THEME.DARK);
        stopTransition();
      };
  
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      
      mediaQuery.addListener(handleChange as any);
      return () => mediaQuery.removeListener(handleChange as any);
    }, [stopTransition, persistedPreferences.theme]);
  
    /**
     * Cleanup on unmount
     */
    useEffect(() => {
      return () => {
        const page = pageRef.current;
        if (page) {
          page.style.removeProperty('--font-scale');
          page.style.removeProperty('--widget-scale');
        }
        
        // Timeout cleanup
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }, []);
  
    // Context érték memoizálása
    const contextValue = useMemo(() => ({
      theme,
      fontScale,
      direction,
      toggleTheme,
      changeFontScale,
      toggleDirection,
      // Extra utility értékek
      isLight: theme === THEME.LIGHT,
      isDark: theme === THEME.DARK,
      isRtl: direction === DIRECTION.RTL,
      isLtr: direction === DIRECTION.LTR
    }), [theme, fontScale, direction, toggleTheme, changeFontScale, toggleDirection]);
  
    return (
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    );
  };
  
  ThemeProvider.displayName = 'ThemeProvider';
  
  export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    
    if (context === undefined) {
      throw new Error(
        'useTheme must be used within a ThemeProvider. ' +
        'Wrap your component tree with <ThemeProvider>.'
      );
    }
    
    return context;
  };
  
  export const useThemeProvider = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    
    if (context === undefined) {
      console.warn(
        'useThemeProvider is used outside of ThemeProvider. ' +
        'Returning default values. Consider using useTheme instead.'
      );
      
      return {
        ...DEFAULT_PREFERENCES,
        toggleTheme: () => {},
        changeFontScale: () => {},
        toggleDirection: () => {},
        isLight: false,
        isDark: true,
        isRtl: false,
        isLtr: true
      } as ThemeContextValue;
    }
    
    return context;
  };
  
  // Export konstansok is használatra
  export { THEME, DIRECTION, FONT_SCALE };