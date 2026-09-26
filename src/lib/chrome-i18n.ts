import es from "@/translations/es.json";
import en from "@/translations/en.json";
import type { Lang } from "@/lib/i18n";

/**
 * Fixed UI chrome dictionary (landing-dxp-builder §3).
 *
 * `src/translations/{es,en}.json` hold ONLY fixed chrome — nav/button/form
 * labels and other shared UI text that is NOT per-entity content. Per-entity
 * marketing copy lives in `src/content/<entity>.json` and is resolved through
 * the repository/service chain + `pickLang`, never here.
 *
 * `tChrome(lang)` returns the chrome dictionary for the active language; both
 * files share the same shape so `es` is a safe type source. `fmt` does simple
 * `{token}` interpolation for the few parameterised labels.
 */
const CHROME = { es, en } as const;

export type Chrome = typeof es;

export function tChrome(lang: Lang): Chrome {
  return (CHROME[lang] ?? CHROME.es) as Chrome;
}

export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
