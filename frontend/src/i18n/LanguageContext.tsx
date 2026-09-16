import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { languages, translations, type LanguageCode } from "./translations";

const STORAGE_KEY = "migration-utility.language";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function readStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && languages.some((language) => language.code === stored)) {
      return stored as LanguageCode;
    }
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall back to default.
  }

  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(readStoredLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore quota / private-browsing failures
    }
  }, [language]);

  const t = useMemo(() => {
    const dictionary = translations[language] ?? translations.en;
    return (key: string) => dictionary[key] ?? translations.en[key] ?? key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
