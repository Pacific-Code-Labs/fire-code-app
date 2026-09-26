import type { Lang } from "@/lib/i18n";

/**
 * Tolerant bilingual resolver for DXP content (landing-dxp-builder RETROFIT).
 *
 * Content copy is stored as `Localized = { es, en }`. `pickLang` resolves it to
 * a plain string for the active language with an `es` fallback, and tolerates
 * partially-migrated shapes so a half-migrated page still renders:
 *   - a plain string passes through unchanged,
 *   - a `{ es, en }` object resolves to `value[lang] ?? value.es ?? value.en`,
 *   - null/undefined resolves to "".
 *
 * This is the single seam every content service resolves through, so consumers
 * read plain strings and never branch on language (no `lang === "es" ? …`).
 */
export type Localized = { es: string; en: string };

export type MaybeLocalized = string | Partial<Localized> | null | undefined;

export function pickLang(value: MaybeLocalized, lang: Lang): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.es ?? value.en ?? "";
}
