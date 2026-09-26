import { useMemo, useState } from "react";
import { Badge, Card, CardBody, Icon } from "@pacific-code-labs/fire-code-design-system";
import { useLang } from "@/contexts/LangContext";
import { actionLabel, moduleLabel, submoduleLabel } from "@/lib/rbacI18n";
import type {
  ActionDto,
  AvailableMatrixDto,
  MatrixModule,
  PermissionGrantDto,
} from "@/types/rbac";

/**
 * PermissionMatrix (FCR-061) — modules → submodules → grantable-action grid,
 * rendered ONLY from the org-filtered available matrix (O2). Port of the POS
 * matrix, adapted to the fire-code-be DTO shape:
 *   - the matrix exposes `moduleId`/`submoduleId` + `actions: string[]` (action
 *     NAMES, not action objects);
 *   - persisted grant rows (O9) and O10 writes use action UUIDs, so we map
 *     name ↔ id through the O13 action catalog (`actions` prop).
 *
 * The internal cell key is `moduleId|submoduleId|actionName` — names are stable
 * within a module/submodule, so the matrix never needs the action id until it
 * serializes back. Doc-type picker logic from the POS source is dropped (no
 * `documents` module in FireCode's catalog).
 */

/** Internal grant key — one selected (module, submodule, action-name) cell. */
export function grantKey(moduleId: string, submoduleId: string, actionName: string): string {
  return `${moduleId}|${submoduleId}|${actionName}`;
}

/**
 * Expand persisted grant rows (O9) into matrix cell keys.
 * Module-wide rows (`submoduleId: null`) expand to every available submodule of
 * the module that carries the action — mirrors the backend's V4 expansion.
 * Grants outside the org's available matrix are DROPPED (stale rows), as are
 * grants whose action id isn't in the catalog.
 */
export function grantsFromPermissions(
  permissions: PermissionGrantDto[],
  matrix: AvailableMatrixDto,
  actions: ActionDto[]
): Set<string> {
  const next = new Set<string>();
  const nameById = new Map(actions.map((a) => [a.id, a.name]));
  for (const grant of permissions) {
    const module = matrix.modules.find((m) => m.moduleId === grant.moduleId);
    if (!module) continue;
    const actionName = nameById.get(grant.actionId);
    if (!actionName) continue;
    const targets = grant.submoduleId
      ? module.submodules.filter((s) => s.submoduleId === grant.submoduleId)
      : module.submodules;
    for (const sub of targets) {
      if (sub.actions.includes(actionName)) {
        next.add(grantKey(module.moduleId, sub.submoduleId, actionName));
      }
    }
  }
  return next;
}

/** Serialize selected cells back to O10 grant rows (explicit submoduleIds + action ids). */
export function grantsToPermissions(
  grants: Set<string>,
  actions: ActionDto[]
): PermissionGrantDto[] {
  const idByName = new Map(actions.map((a) => [a.name, a.id]));
  const out: PermissionGrantDto[] = [];
  for (const key of grants) {
    const [moduleId, submoduleId, actionName] = key.split("|");
    const actionId = idByName.get(actionName);
    if (!actionId) continue; // action not in catalog — skip (defensive)
    out.push({ moduleId, submoduleId, actionId });
  }
  return out;
}

interface PermissionMatrixProps {
  matrix: AvailableMatrixDto | undefined;
  isLoading: boolean;
  error?: string | null;
  grants: Set<string>;
  onChange: (next: Set<string>) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({
  matrix,
  isLoading,
  error,
  grants,
  onChange,
  readOnly = false,
}: PermissionMatrixProps) {
  const { tr } = useLang();
  // Accordion: only one module card open at a time so the drawer stays scannable.
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  const modules = useMemo(() => matrix?.modules ?? [], [matrix]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-4 w-36 mb-3 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full mb-2 rounded bg-muted/60 animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted/60 animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-destructive/40">
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card className="p-5 text-center">
        <p className="text-sm text-muted-foreground">{tr.roles_matrix_empty}</p>
      </Card>
    );
  }

  const toggleCell = (key: string) => {
    if (readOnly) return;
    const next = new Set(grants);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const setMany = (keys: string[], selected: boolean) => {
    if (readOnly) return;
    const next = new Set(grants);
    for (const key of keys) {
      if (selected) next.add(key);
      else next.delete(key);
    }
    onChange(next);
  };

  const moduleKeys = (module: MatrixModule): string[] =>
    module.submodules.flatMap((sub) =>
      sub.actions.map((a) => grantKey(module.moduleId, sub.submoduleId, a))
    );

  return (
    <div className="flex flex-col gap-3">
      {modules.map((module) => {
        const allKeys = moduleKeys(module);
        const selectedCount = allKeys.filter((k) => grants.has(k)).length;
        const allSelected = allKeys.length > 0 && selectedCount === allKeys.length;
        const isExpanded = openModuleId === module.moduleId;

        return (
          <Card key={module.moduleId} className="overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              onClick={() =>
                setOpenModuleId((cur) => (cur === module.moduleId ? null : module.moduleId))
              }
              aria-expanded={isExpanded}
            >
              <Icon name={module.icon ?? "shield"} size={16} className="text-primary" />
              <span className="flex-1 text-sm font-semibold text-foreground">
                {moduleLabel(tr, module.name, module.displayName)}
              </span>
              <Badge variant={selectedCount > 0 ? "default" : "outline"}>
                {tr.roles_matrix_selected.replace("{count}", String(selectedCount))}
              </Badge>
              <Icon name={isExpanded ? "chevronUp" : "chevronDown"} size={16} className="text-muted-foreground" />
            </button>

            {isExpanded && (
              <CardBody className="border-t border-border pt-3">
                {!readOnly && (
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold cursor-pointer hover:bg-muted"
                      onClick={() => setMany(allKeys, !allSelected)}
                    >
                      <Icon name={allSelected ? "close" : "check"} size={11} />
                      {allSelected ? tr.roles_matrix_clear_all : tr.roles_matrix_select_all}
                    </button>
                  </div>
                )}

                {module.submodules.map((sub) => (
                  <div
                    key={sub.submoduleId}
                    className="flex flex-col gap-1.5 py-1.5 border-b border-border/40 last:border-b-0"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {submoduleLabel(tr, module.name, sub.name, sub.displayName)}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.actions.map((action) => {
                        const key = grantKey(module.moduleId, sub.submoduleId, action);
                        const selected = grants.has(key);
                        return (
                          <button
                            key={action}
                            type="button"
                            disabled={readOnly}
                            aria-pressed={selected}
                            onClick={() => toggleCell(key)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                              selected
                                ? "border-transparent bg-primary/[0.12] text-primary"
                                : "border-border text-muted-foreground"
                            } ${readOnly ? "cursor-default opacity-80" : "cursor-pointer hover:bg-muted"}`}
                          >
                            {selected && <Icon name="check" size={11} />}
                            {actionLabel(tr, action)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardBody>
            )}
          </Card>
        );
      })}
    </div>
  );
}
