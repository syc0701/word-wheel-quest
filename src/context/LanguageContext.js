import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentLocale,
  getLocaleMeta,
  isRtlLocale,
  loadLanguage,
  LOCALES,
  saveLanguage,
  t as translate,
} from '../lib/i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getCurrentLocale());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadLanguage();
      if (!cancelled) {
        setLocaleState(loaded);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(async (code) => {
    const next = await saveLanguage(code);
    setLocaleState(next);
    return next;
  }, []);

  const t = useCallback((key, params) => translate(key, params), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      ready,
      t,
      locales: LOCALES,
      meta: getLocaleMeta(locale),
      isRtl: isRtlLocale(locale),
    }),
    [locale, setLocale, ready, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: 'en',
      setLocale: async () => 'en',
      ready: true,
      t: translate,
      locales: LOCALES,
      meta: getLocaleMeta('en'),
      isRtl: false,
    };
  }
  return ctx;
}

/** Convenience hook when only translation is needed. */
export function useT() {
  return useLanguage().t;
}
