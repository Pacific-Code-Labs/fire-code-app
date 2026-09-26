import type { Lang } from "@/lib/i18n";

/** The marketing landing (separate repo/site). Localhost in dev via reboot-server.sh. */
export const LANDING_URL = (import.meta.env.VITE_LANDING_URL ?? "https://fire-code.jcampos.dev").replace(/\/+$/, "");

/** Absolute landing URL for a language (+ optional section slug, e.g. "pricing"). */
export function landingHref(lang: Lang, section = ""): string {
  return `${LANDING_URL}/${lang}${section ? `/${section.replace(/^\/+/, "")}` : ""}`;
}
