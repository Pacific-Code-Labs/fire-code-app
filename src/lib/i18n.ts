import esT from "@/translations/es.json";
import enT from "@/translations/en.json";

export type Lang = "es" | "en";

/**
 * FCR-080: the app UI strings are now ADMIN-MANAGED JSON, not burned in code.
 * They live in `src/translations/{es,en}.json` under the `app` namespace,
 * organized into sections (common, navigation, auth, profile, roles, rbac,
 * electrical, demo) and edited in the `fire-code-admin` Translations page
 * (which writes back here + git-pushes). The `common` section is the shared
 * bucket for strings that don't belong to one screen.
 *
 * Here we FLATTEN-MERGE those sections back into a single flat dictionary so
 * every existing `tr.<key>` call site keeps working unchanged. Keys are globally
 * unique across sections, so the merge is lossless. The landing/marketing chrome
 * (the top-level `nav`/`demo`/`notFound` in the same files) stays resolved via
 * `lib/chrome-i18n.ts` `tChrome` — untouched.
 */
type Sections = Record<string, Record<string, string>>;

function mergeApp(json: { app?: Sections }): Record<string, string> {
  return Object.assign({}, ...Object.values(json.app ?? {}));
}

export const t = {
  es: mergeApp(esT as { app?: Sections }),
  en: mergeApp(enT as { app?: Sections }),
};

/** A resolved language dictionary (flat string map). */
export type Dict = Record<string, string>;
