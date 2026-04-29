"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  useCallback,
} from "react";

export type ThemeColor = "blue" | "red";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "blue",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getStoredTheme(): ThemeColor {
  if (typeof window === "undefined") return "blue";
  const stored = localStorage.getItem("app-theme");
  return stored === "red" ? "red" : "blue";
}

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getStoredTheme, () => "blue");

  const setTheme = useCallback((newTheme: ThemeColor) => {
    localStorage.setItem("app-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    emitChange();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
