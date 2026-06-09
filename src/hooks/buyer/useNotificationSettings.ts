import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@lefto_notification_settings';

export interface NotificationSettings {
  orders:       boolean;
  favs:         boolean;
  promos:       boolean;
  newListings:  boolean;
  karam:        boolean;
  dailyReminder: boolean;
  reminderDays: string[];
}

const DEFAULT_SETTINGS: NotificationSettings = {
  orders:        true,
  favs:          true,
  promos:        false,
  newListings:   true,
  karam:         true,
  dailyReminder: false,
  reminderDays:  ['الاثنين', 'الأربعاء', 'الجمعة'],
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as Partial<NotificationSettings>;
        setSettings(prev => ({ ...prev, ...saved }));
      } catch {}
    });
  }, []);

  const update = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleDay = useCallback((day: string) => {
    setSettings(prev => {
      const days = prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day];
      const next = { ...prev, reminderDays: days };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update, toggleDay };
}
