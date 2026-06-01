'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import en from './en.json';
import ro from './ro.json';

const translations = { en, ro };

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ev-locale') || 'en';
    }
    return 'en';
  });

  const changeLocale = useCallback((newLocale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ev-locale', newLocale);
    }
  }, []);

  // Nested key access: t('workers.experienceLevels.senior')
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      value = value?.[k];
    }
    if (value === undefined) {
      // Fallback to English
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, paramValue),
        value
      );
    }
    return value ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}

export { I18nContext };
