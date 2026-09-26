/**
 * useRbac (FCR-061) — org-scoped RBAC hooks over fire-code-be O1–O14.
 *
 * userId (Cognito sub) + orgId are resolved from GET /me (useMe), so the
 * hooks need no params — pass-through to rbacApi with the resolved ids.
 *
 * Query keys (shared so sidebar + pages + the matrix share one fetch each):
 *   ["rbac","my-permissions",orgId]    O1
 *   ["rbac","matrix",orgId]            O2
 *   ["rbac","roles",orgId]             O4
 *   ["rbac","role-permissions",orgId,roleId]  O9
 */
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rbacApi } from "@/services/rbacApi";
import { useMe } from "@/hooks/useMe";
import type {
  ActionDto,
  AvailableMatrixDto,
  MyPermissionsDto,
  PermissionGrantDto,
  RoleCreateRequest,
  RoleDto,
  RoleUpdateRequest,
} from "@/types/rbac";

// ─── Queries ────────────────────────────────────────────────────────────────

/** O1 — caller's effective permissions in the org (nav/action gating). */
export function useMyPermissions(userId: string | undefined, orgId: string | undefined) {
  return useQuery<MyPermissionsDto>({
    queryKey: ["rbac", "my-permissions", orgId],
    queryFn: () => rbacApi.getMyPermissions(userId!, orgId!),
    enabled: !!userId && !!orgId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/** O2 — org-filtered modules → submodules → grantable actions (matrix UI). */
export function useAvailableMatrix(
  userId: string | undefined,
  orgId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<AvailableMatrixDto>({
    queryKey: ["rbac", "matrix", orgId],
    queryFn: () => rbacApi.getAvailableMatrix(userId!, orgId!),
    enabled: !!userId && !!orgId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}

/** O4 — org roles + system role templates (platform_admin excluded server-side). */
export function useOrgRoles(userId: string | undefined, orgId: string | undefined) {
  return useQuery<RoleDto[]>({
    queryKey: ["rbac", "roles", orgId],
    queryFn: () => rbacApi.listOrgRoles(userId!, orgId!),
    enabled: !!userId && !!orgId,
  });
}

/** O9 — grant rows of one role (org role or system template). */
export function useRolePermissions(
  userId: string | undefined,
  orgId: string | undefined,
  roleId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<PermissionGrantDto[]>({
    queryKey: ["rbac", "role-permissions", orgId, roleId],
    queryFn: () => rbacApi.getRolePermissions(userId!, orgId!, roleId!),
    enabled: !!userId && !!orgId && !!roleId && (options?.enabled ?? true),
  });
}

/**
 * O13 — global action (verb) catalog. The matrix needs this to map action
 * NAMES (all the available-matrix exposes) ↔ action IDs (what O10 grant rows
 * carry). Cached long; the verb catalog is effectively static.
 */
export function useActions(
  userId: string | undefined,
  orgId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<ActionDto[]>({
    queryKey: ["rbac", "actions", orgId],
    queryFn: () => rbacApi.listActions(userId!, orgId!),
    enabled: !!userId && !!orgId && (options?.enabled ?? true),
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export interface CreateRoleInput extends RoleCreateRequest {
  userId: string;
  orgId: string;
}

/** O6 — create org role (organizationId forced from path server-side). */
export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, ...body }: CreateRoleInput) =>
      rbacApi.createRole(userId, orgId, body),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["rbac", "roles", vars.orgId] }),
  });
}

export interface UpdateRoleInput extends RoleUpdateRequest {
  userId: string;
  orgId: string;
  roleId: string;
}

/** O7 — update org role (404 cross-org, 400 system roles). */
export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, roleId, ...body }: UpdateRoleInput) =>
      rbacApi.updateRole(userId, orgId, roleId, body),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["rbac", "roles", vars.orgId] }),
  });
}

/** O8 — delete org role (RoleInUseError on 409 when members reference it). */
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, roleId }: { userId: string; orgId: string; roleId: string }) =>
      rbacApi.deleteRole(userId, orgId, roleId),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["rbac", "roles", vars.orgId] }),
  });
}

export interface SetRolePermissionsInput {
  userId: string;
  orgId: string;
  roleId: string;
  permissions: PermissionGrantDto[];
}

/** O10 — bulk replace a role's permission set (PermissionSubsetError on 400). */
export function useSetRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, roleId, permissions }: SetRolePermissionsInput) =>
      rbacApi.setRolePermissions(userId, orgId, roleId, permissions),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rbac", "role-permissions", vars.orgId, vars.roleId] });
      qc.invalidateQueries({ queryKey: ["rbac", "my-permissions", vars.orgId] });
    },
  });
}

export interface AssignMemberRoleInput {
  userId: string;
  orgId: string;
  memberId: string;
  roleId: string;
}

/** O11 — assign a role to an organization member (V3 enforced server-side). */
export function useAssignMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, orgId, memberId, roleId }: AssignMemberRoleInput) =>
      rbacApi.setMemberRole(userId, orgId, memberId, roleId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["org-members", vars.orgId] });
      qc.invalidateQueries({ queryKey: ["rbac", "my-permissions", vars.orgId] });
    },
  });
}

// ─── Permission gating helper ───────────────────────────────────────────────

export interface UsePermissionsResult {
  /**
   * `can(module, action, submodule?)` over the flattened
   * "module:submodule:action" strings. The backend already expands module-wide
   * grants per submodule, so an omitted `submodule` matches ANY submodule of
   * the module that carries the action.
   */
  can: (module: string, action: string, submodule?: string) => boolean;
  /** Module-level nav gating (MyPermissionsDto.modules). */
  hasModule: (module: string) => boolean;
  modules: string[];
  isOwner: boolean;
  isAdmin: boolean;
  /** True once my-permissions resolved with data — gating only applies then. */
  isReady: boolean;
  isLoading: boolean;
  role: MyPermissionsDto["role"] | null;
}

/**
 * Nav/route/action gating hook backed by O1 my-permissions, sharing the cache
 * key ["rbac","my-permissions",orgId] with useMyPermissions. Resolves userId
 * (Cognito sub) from useMe + orgId from useMe.
 *
 * ⚠️ FAIL-OPEN while the permission set is unresolved (loading OR the request
 * failed): the backend currently ships with RBAC_ENFORCEMENT=log (FCR-029), so
 * the UI must NOT lock users out before enforcement is live — `can()` and
 * `hasModule()` return true until data arrives. Once data resolves, gating is
 * enforced (owner short-circuits to all-true).
 *
 * TODO(FCR-029): flip to FAIL-CLOSED — `if (!data) return false` in both
 * `can` and `hasModule` — in the SAME change that flips the backend
 * RBAC_ENFORCEMENT from `log` to `enforce`. Until then, leaving these
 * fail-closed would lock every user out (no permissions are enforced yet).
 */
export function usePermissions(): UsePermissionsResult {
  const { userId, organizationId } = useMe();
  const query = useMyPermissions(userId, organizationId);
  const data = query.data;

  const can = useCallback(
    (module: string, action: string, submodule?: string): boolean => {
      if (!data) return true; // fail-open until permissions resolve (RBAC_ENFORCEMENT=log)
      if (data.isOwner) return true;
      if (submodule) {
        return data.permissions.includes(`${module}:${submodule}:${action}`);
      }
      return data.permissions.some((p) => {
        const [m, , a] = p.split(":");
        return m === module && a === action;
      });
    },
    [data]
  );

  const hasModule = useCallback(
    (module: string): boolean => {
      if (!data) return true; // fail-open until permissions resolve (RBAC_ENFORCEMENT=log)
      if (data.isOwner) return true;
      return data.modules.includes(module);
    },
    [data]
  );

  return {
    can,
    hasModule,
    modules: data?.modules ?? [],
    isOwner: data?.isOwner ?? false,
    isAdmin: data?.isAdmin ?? false,
    isReady: !!data,
    isLoading: query.isLoading,
    role: data?.role ?? null,
  };
}
