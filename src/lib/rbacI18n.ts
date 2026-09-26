/**
 * Localized labels for the RBAC catalog (FCR-061).
 *
 * The platform API stores a single `displayName` per module/submodule/action/
 * role (mixed ES/EN seeds), so the UI translates by the STABLE catalog `name`
 * via the LangContext dictionary (`tr`) and only falls back to the server
 * `displayName` when no key exists (e.g. custom org roles, or modules added
 * before their i18n keys ship).
 *
 * FireCode's i18n is a flat dictionary object (`tr` from useLang), so keys are
 * flattened with underscores: `rbac_module_<name>`, `rbac_sub_<module>_<name>`,
 * `rbac_action_<name>`, `rbac_role_<name>_name`, `rbac_role_<name>_desc`.
 */
import type { Dict } from "@/lib/i18n";

/** Read a dynamic key off the dict, falling back to a server-provided value. */
function trOr(tr: Dict, key: string, fallback: string): string {
  const value = (tr as unknown as Record<string, string | undefined>)[key];
  return value ?? fallback;
}

export function moduleLabel(tr: Dict, name: string, displayName: string): string {
  return trOr(tr, `rbac_module_${name}`, displayName);
}

export function submoduleLabel(
  tr: Dict,
  moduleName: string,
  name: string,
  displayName: string
): string {
  return trOr(tr, `rbac_sub_${moduleName}_${name}`, displayName);
}

export function actionLabel(tr: Dict, name: string, displayName?: string): string {
  return trOr(tr, `rbac_action_${name}`, displayName ?? name);
}

/** System role template names (owner/admin/…); custom org roles fall back. */
export function roleLabel(tr: Dict, name: string, displayName: string): string {
  return trOr(tr, `rbac_role_${name}_name`, displayName);
}

export function roleDescription(
  tr: Dict,
  name: string,
  description: string | null | undefined
): string {
  return trOr(tr, `rbac_role_${name}_desc`, description ?? "");
}
