import type { Lang } from "@/lib/i18n";

// Re-export so callers can `import type { Lang } from "@/lib/paths"` too.
export type { Lang };

export const DEFAULT_LANG: Lang = "es";

export function isLang(s: string): s is Lang {
  return s === "es" || s === "en";
}

/**
 * Build a language-prefixed path.
 * - localizedPath("es")            → "/es"
 * - localizedPath("es", "/")       → "/es"
 * - localizedPath("es", "/demo")   → "/es/demo"
 * - localizedPath("en", "/projects/new") → "/en/projects/new"
 *
 * `path` is expected to start with "/" (except "" / "/" which mean the root).
 */
export function localizedPath(lang: Lang, path: string = "/"): string {
  if (path === "" || path === "/") return `/${lang}`;
  return `/${lang}${path}`;
}

/**
 * Split a pathname into its language prefix (if any) and the remaining path.
 * - "/es/demo" → { lang: "es", rest: "/demo" }
 * - "/en"      → { lang: "en", rest: "/" }
 * - "/demo"    → { lang: null, rest: "/demo" }
 * - "/"        → { lang: null, rest: "/" }
 *
 * `rest` always starts with "/".
 */
export function stripLangPrefix(pathname: string): { lang: Lang | null; rest: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0 || !isLang(segments[0])) {
    return { lang: null, rest: pathname === "" ? "/" : pathname };
  }
  const lang = segments[0];
  const rest = segments.slice(1).join("/");
  return { lang, rest: rest === "" ? "/" : `/${rest}` };
}

const STORAGE_KEY = "firecode-lang";

/** Read the persisted language (localStorage), falling back to DEFAULT_LANG. */
export function persistedLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLang(stored)) return stored;
  } catch {
    /* ignore availability */
  }
  return DEFAULT_LANG;
}

type NavigateFn = (to: string) => void;

/**
 * Animated language switch. Adds the ".lang-anim-out" class to the document
 * body, navigates to `target` after the exit beat (~220ms), then swaps in
 * ".lang-anim-in" so the new page fades in. Honors prefers-reduced-motion by
 * navigating immediately with no animation.
 *
 * `setLang` itself stays untouched in LangContext (pure state + localStorage);
 * the LangLayout effect syncs the context off the new URL language.
 */
export function runLangSwitch(navigate: NavigateFn, target: string): void {
  const reduce =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || typeof document === "undefined") {
    navigate(target);
    return;
  }

  const root = document.body;
  root.classList.remove("lang-anim-in");
  root.classList.add("lang-anim-out");

  window.setTimeout(() => {
    navigate(target);
    root.classList.remove("lang-anim-out");
    root.classList.add("lang-anim-in");
    window.setTimeout(() => root.classList.remove("lang-anim-in"), 360);
  }, 220);
}
