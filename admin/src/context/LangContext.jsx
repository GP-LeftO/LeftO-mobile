import React, { createContext, useContext, useState, useEffect } from 'react';
import { strings } from '../i18n';

const LangCtx = createContext({ lang: 'ar', t: (k) => k, setLang: () => {}, theme: 'light', toggleTheme: () => {} });
export const useLang = () => useContext(LangCtx);
export const useT    = () => useContext(LangCtx).t;

export function LangProvider({ children }) {
  const [lang,  setLangState]  = useState(() => localStorage.getItem('adminLang')  || 'ar');
  const [theme, setThemeState] = useState(() => localStorage.getItem('adminTheme') || 'light');

  const setLang = (l) => { setLangState(l); localStorage.setItem('adminLang', l); };

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('adminTheme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const t = (key) => strings[lang]?.[key] ?? strings.ar[key] ?? key;

  return (
    <LangCtx.Provider value={{ lang, t, setLang, theme, toggleTheme }}>
      {children}
    </LangCtx.Provider>
  );
}
