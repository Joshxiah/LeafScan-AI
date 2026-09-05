/**
 * App-wide language selection for LeafScan AI.
 *
 * Any screen reads the current translations with:
 *
 *   const { t } = useLanguage();
 *   <Text>{t.home.goodDay}</Text>
 *
 * The choice is saved on the device, so it is remembered across
 * app restarts and applies everywhere - including the sign-in
 * screen the farmer sees before they are even logged in.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

import { getLanguage, saveLanguage } from '../services/storage';
import { Language, Translations, TRANSLATIONS } from '../i18n/translations';

interface LanguageContextValue {
  language: Language;
  /** The active dictionary - always fully populated, see Translations. */
  t: Translations;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'ceb';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load whatever was saved from a previous session. Defaulting to
  // English above means the very first frame renders correctly
  // even before this finishes.
  useEffect(() => {
    let isMounted = true;

    getLanguage().then((saved) => {
      if (isMounted && saved && isLanguage(saved)) {
        setLanguageState(saved);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void saveLanguage(next);
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, t: TRANSLATIONS[language], setLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used inside a LanguageProvider');
  }

  return context;
}
