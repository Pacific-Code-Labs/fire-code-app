import { useEffect, useState } from "react";
import { Button, Drawer, FormField, Input } from "@pacific-code-labs/fire-code-design-system";
import { useLang } from "@/contexts/LangContext";
import { useMe } from "@/hooks/useMe";
import {
  useActions,
  useAvailableMatrix,
  useCreateRole,
  useRolePermissions,
  useSetRolePermissions,
  useUpdateRole,
} from "@/hooks/useRbac";
import { PermissionSubsetError } from "@/services/rbacApi";
import {
  PermissionMatrix,
  grantsFromPermissions,
  grantsToPermissions,
} from "@/components/roles/PermissionMatrix";
import { roleDescription, roleLabel } from "@/lib/rbacI18n";
import type { RoleDto } from "@/types/rbac";

/**
 * Derive the unique role identifier (`roles.name`) from the display name on
 * create — matches the system-role naming style (`platform_admin`, `staff`).
 */
function slugifyRoleName(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || `role_${Date.now()}`;
}

interface RoleDrawerFormProps {
  open: boolean;
  onClose: () => void;
  /** Org role being edited. Null/undefined = create mode. */
  role?: RoleDto | null;
  /** Role whose permissions seed a NEW custom role ("duplicate as custom"). */
  duplicateFrom?: RoleDto | null;
  /** View-only mode (system role templates). */
  readOnly?: boolean;
  /** Shown in readOnly mode: switch to duplicate-as-custom for this role. */
  onDuplicate?: () => void;
}

/**
 * Role create/edit drawer (FCR-061) — name/description + the org-filtered
 * permission matrix (O2). Saves the role (O6/O7) then bulk-replaces its
 * permission set (O10). A 400 subset-violation surfaces as a clear error
 * (PermissionSubsetError) rather than a generic failure.
 */
export function RoleDrawerForm({
  open,
  onClose,
  role,
  duplicateFrom,
  readOnly = false,
  onDuplicate,
}: RoleDrawerFormProps) {
  const { userId, organizationId: orgId } = useMe();
  const { tr } = useLang();

  const sourceRole = role ?? duplicateFrom ?? null;

  const matrixQuery = useAvailableMatrix(userId, orgId, { enabled: open });
  const actionsQuery = useActions(userId, orgId, { enabled: open });
  const permsQuery = useRolePermissions(userId, orgId, sourceRole?.id, {
    enabled: open && !!sourceRole,
  });

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const setRolePermissions = useSetRolePermissions();

  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [grants, setGrants] = useState<Set<string>>(new Set());
  const [grantsInitialized, setGrantsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Keeps the created role across a failed permissions write so retrying the
  // save doesn't create a duplicate role.
  const [createdRole, setCreatedRole] = useState<RoleDto | null>(null);

  // Reset the form whenever the drawer opens for a (possibly different) role.
  useEffect(() => {
    if (!open) return;
    setDisplayName(
      role?.displayName ??
        (duplicateFrom
          ? tr.roles_form_copy_name.replace(
              "{name}",
              roleLabel(tr, duplicateFrom.name, duplicateFrom.displayName)
            )
          : "")
    );
    setDescription(role?.description ?? duplicateFrom?.description ?? "");
    setIsActive(role?.isActive ?? true);
    setGrants(new Set());
    setGrantsInitialized(!sourceRole); // blank role starts empty, no perms to load
    setError(null);
    setSaving(false);
    setCreatedRole(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?.id, duplicateFrom?.id]);

  // Seed the matrix selection once the matrix, the action catalog and the
  // grant rows all resolve (the action catalog maps grant ids → names).
  useEffect(() => {
    if (!open || grantsInitialized) return;
    if (permsQuery.data && matrixQuery.data && actionsQuery.data) {
      setGrants(grantsFromPermissions(permsQuery.data, matrixQuery.data, actionsQuery.data));
      setGrantsInitialized(true);
    }
  }, [open, grantsInitialized, permsQuery.data, matrixQuery.data, actionsQuery.data]);

  const isEdit = !!role || !!createdRole;

  const handleSave = async () => {
    if (readOnly || !userId || !orgId || saving) return;
    const name = displayName.trim();
    if (!name) {
      setError(tr.roles_form_name_required);
      return;
    }
    if (!actionsQuery.data) {
      setError(tr.roles_matrix_load_error);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let target = role ?? createdRole;
      if (!target) {
        // O6 — organizationId is forced from the path server-side.
        target = await createRole.mutateAsync({
          userId,
          orgId,
          name: slugifyRoleName(name),
          displayName: name,
          description: description.trim() || undefined,
        });
        setCreatedRole(target);
      } else {
        // O7 — `name` stays stable; only display fields + isActive change.
        await updateRole.mutateAsync({
          userId,
          orgId,
          roleId: target.id,
          displayName: name,
          description: description.trim() || undefined,
          isActive,
        });
      }
      // O10 — bulk replace; backend subset-validates against the org matrix.
      await setRolePermissions.mutateAsync({
        userId,
        orgId,
        roleId: target.id,
        permissions: grantsToPermissions(grants, actionsQuery.data),
      });
      onClose();
    } catch (err) {
      if (err instanceof PermissionSubsetError) {
        setError(err.message || tr.roles_form_subset_error);
      } else {
        setError(err instanceof Error ? err.message : tr.roles_form_save_failed);
      }
    } finally {
      setSaving(false);
    }
  };

  const title = readOnly
    ? tr.roles_form_view_title
    : isEdit
      ? tr.roles_form_edit_title
      : tr.roles_form_create_title;

  const subtitle = readOnly
    ? sourceRole
      ? roleLabel(tr, sourceRole.name, sourceRole.displayName)
      : undefined
    : duplicateFrom
      ? tr.roles_form_duplicate_subtitle.replace(
          "{name}",
          roleLabel(tr, duplicateFrom.name, duplicateFrom.displayName)
        )
      : undefined;

  const matrixLoading =
    matrixQuery.isLoading ||
    actionsQuery.isLoading ||
    (!!sourceRole && !grantsInitialized && permsQuery.isLoading);
  const matrixError =
    matrixQuery.isError || actionsQuery.isError || permsQuery.isError
      ? tr.roles_matrix_load_error
      : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon="shield"
      width={560}
      footer={
        <div className="flex gap-2.5 px-6 py-4 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            {readOnly ? tr.common_close : tr.common_cancel}
          </Button>
          {readOnly && onDuplicate && (
            <Button variant="primary" size="sm" icon="copy" onClick={onDuplicate}>
              {tr.roles_duplicate}
            </Button>
          )}
          {!readOnly && (
            <Button
              variant="primary"
              size="sm"
              icon="check"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              {saving
                ? tr.roles_form_saving
                : isEdit
                  ? tr.roles_form_save
                  : tr.roles_form_create}
            </Button>
          )}
        </div>
      }
    >
      <div className="p-6 space-y-5">
        {readOnly && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
            <span className="text-sm text-muted-foreground">{tr.roles_form_system_notice}</span>
          </div>
        )}

        {readOnly && sourceRole && (
          <div>
            <div className="t-label mb-1">{tr.roles_form_description}</div>
            <p className="text-sm text-muted-foreground">
              {roleDescription(tr, sourceRole.name, sourceRole.description) ||
                tr.roles_form_no_description}
            </p>
          </div>
        )}

        {!readOnly && (
          <>
            <FormField label={tr.roles_form_name} required>
              <Input
                value={displayName}
                placeholder={tr.roles_form_name_placeholder}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </FormField>

            <FormField label={tr.roles_form_description}>
              <textarea
                className="min-h-[72px] w-full resize-y rounded-[calc(var(--radius)-0.15rem)] border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={description}
                placeholder={tr.roles_form_description_placeholder}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>

            {isEdit && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-primary"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {tr.roles_form_active}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {tr.roles_form_active_help}
                  </span>
                </span>
              </label>
            )}
          </>
        )}

        <div>
          <div className="t-label mb-1">{tr.roles_form_permissions}</div>
          <p className="text-sm text-muted-foreground mb-3">{tr.roles_form_permissions_help}</p>
          <PermissionMatrix
            matrix={matrixQuery.data}
            isLoading={matrixLoading}
            error={matrixError}
            grants={grants}
            onChange={setGrants}
            readOnly={readOnly}
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/[0.08] px-3 py-2.5">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}
      </div>
    </Drawer>
  );
}
