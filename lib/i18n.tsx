import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";
import { ar } from "@/locales/ar";
import { fr, en, pt } from "@/locales/translations";
import type { T } from "@/locales/ar";

export type Language = "ar" | "fr" | "en" | "pt";

const STORAGE_KEY = "royal_voyage_language";

const translations: Record<Language, T> = { ar, fr, en, pt };

export const LANGUAGE_OPTIONS: {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  rtl: boolean;
}[] = [
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇲🇷", rtl: true },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", rtl: false },
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", rtl: false },
  { code: "pt", label: "Portuguese", nativeLabel: "Português", flag: "🇵🇹", rtl: false },
];

interface I18nContextType {
  language: Language;
  t: T;
  isRTL: boolean;
  setLanguage: (lang: Language) => Promise<void>;
}

const I18nContext = createContext<I18nContextType>({
  language: "ar",
  t: ar,
  isRTL: true,
  setLanguage: async () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>("ar");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "ar" || saved === "fr" || saved === "en" || saved === "pt") {
        setLang(saved);
        I18nManager.forceRTL(saved === "ar");
      } else {
        // العربية هي اللغة الافتراضية
        I18nManager.forceRTL(true);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    I18nManager.forceRTL(lang === "ar");
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const isRTL = language === "ar";
  const t = translations[language];

  const contextValue = useMemo(() => ({ language, t, isRTL, setLanguage }), [language, t, isRTL, setLanguage]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation(): I18nContextType {
  return useContext(I18nContext);
}

// Alias for convenience
export function useI18n() {
  return useContext(I18nContext);
}

// Alias for LANGUAGE_OPTIONS
export const LANGUAGES = LANGUAGE_OPTIONS.map((l) => ({
  code: l.code,
  name: l.label,
  nativeName: l.nativeLabel,
  flag: l.flag,
}));
