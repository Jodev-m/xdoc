"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface AppSettings {
  fontSize: number;
  autoSaveInterval: number;
  lineHeight: number;
}

const DEFAULTS: AppSettings = {
  fontSize: 16,
  autoSaveInterval: 30,
  lineHeight: 1.6,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const raw = localStorage.getItem("xdoc-settings");
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem("xdoc-settings", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
