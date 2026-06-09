import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAppConfig } from '../services/shared/community.service';

interface AppConfig {
  isRamadanSeason: boolean;
  isIftarWindow: boolean;
  maghribTime: string | null;
}

const DEFAULT: AppConfig = { isRamadanSeason: false, isIftarWindow: false, maghribTime: null };

const AppConfigContext = createContext<AppConfig>(DEFAULT);

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT);

  useEffect(() => {
    fetchAppConfig()
      .then(c => setConfig({
        isRamadanSeason: c.isRamadanSeason ?? false,
        isIftarWindow:   c.isIftarWindow   ?? false,
        maghribTime:     c.maghribTime     ?? null,
      }))
      .catch(() => {}); // fail silently — defaults to false
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

export const useAppConfig = () => useContext(AppConfigContext);
