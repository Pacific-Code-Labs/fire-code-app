import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { t, type Lang, type Dict } from "@/lib/i18n";

interface Ctx { lang: Lang; setLang: (l: Lang) => void; tr: Dict; }
const LangCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "firecode-lang";

function getInitial(): Lang {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "es" || stored === "en" ? stored : "es";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitial);

  // Admin-safe language switch (landing-dxp-builder, admin-shell.md). The public
  // site's language is NOT URL-prefixed (routes are not `/<lang>/...`), so this
  // switch only updates state + persists — it NEVER navigates. That makes it
  // safe to call from the admin topbar: switching language inside `/admin` flips
  // the chrome/preview language in place without kicking the author out of the
  // panel. The bilingual content editors always show both `es`/`en` sides
  // regardless, so only the display language changes.
  const setLang = useCallback((next: Lang) => {
    setLangState((cur) => {
      if (next === cur) return cur;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore quota/availability */
      }
      return next;
    });
  }, []);

  return <LangCtx.Provider value={{ lang, setLang, tr: t[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useLang outside provider");
  return c;
}

/**
 * Admin-friendly alias of `useLang` (landing-dxp-builder naming). Admin chrome
 * reads `{ language, setLanguage }`; both map to the same in-place, persisted,
 * non-navigating language state the public site uses.
 */
export function useLanguage() {
  const { lang, setLang } = useLang();
  return { language: lang, setLanguage: setLang };
}

export const LANGS: Lang[] = ["es", "en"];
