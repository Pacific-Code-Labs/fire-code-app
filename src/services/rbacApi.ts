/**
 * rbacApi (FCR-061) — typed client for GET /me + the org-scoped RBAC surface
 * (O1–O15) on fire-code-be.
 *
 * All RBAC routes are authenticated and org-scoped under
 *   /users/{userId}/organization/{orgId}/rbac/...
 * and the caller's userId/orgId come from GET /me (useMe). Every request sends
 * `Authorization: Bearer <Cognito accessToken>` via `authHeader()` — the same
 * mechanism `fireCodeApi` uses for /projects* and /evaluate (FCR-010). No SigV4
 * fallback here: these routes are always behind the Cognito User Pool
 * authorizer, so a signed-out caller gets a 401 (expected).
 *
 * DTOs mirror fire-code-be `src/dtos/rbac_dto.py` / `me_dto.py` (see types/rbac.ts).
 */

import { get, post, put, del } from "aws-amplify/api";
import { authHeader } from "./authToken";
import type {
  ActionDto,
  ActionListResponse,
  AvailableMatrixDto,
  CheckPermissionRequest,
  CheckPermissionResponse,
  MeResponse,
  MyPermissionsDto,
  PermissionGrantDto,
  RoleCreateRequest,
  RoleDto,
  RoleListResponse,
  RolePermissionsResponse,
  RoleUpdateRequest,
  SetMemberRoleRequest,
  SetRolePermissionsRequest,
  UserRoleResponse,
} from "@/types/rbac";

const API_NAME = "FireCodeApi";

/** Build the org-scoped RBAC path prefix (mirrors the BE `_PREFIX`). */
function rbacPath(userId: string, orgId: string, endpoint = ""): string {
  return `/users/${encodeURIComponent(userId)}/organization/${encodeURIComponent(orgId)}/rbac${endpoint}`;
}

async function resolveBody<T>(op: {
  response: Promise<{ body: { json: () => Promise<unknown> } }>;
}): Promise<T> {
  const resp = await op.response;
  return (await resp.body.json()) as T;
}

function httpStatus(err: unknown): number | undefined {
  if (err && typeof err === "object") {
    const e = err as {
      response?: { statusCode?: number; status?: number };
      statusCode?: number;
      status?: number;
    };
    return e.response?.statusCode ?? e.response?.status ?? e.statusCode ?? e.status;
  }
  return undefined;
}

/** Read the FastAPI error body (`detail`-wrapped or top-level) off an Amplify error. */
async function errorBody(err: unknown): Promise<unknown> {
  const e = err as { response?: { body?: { json?: () => Promise<unknown> } } };
  try {
    return await e.response?.body?.json?.();
  } catch {
    return undefined;
  }
}

/**
 * Thrown by `deleteRole` when the BE returns HTTP 409 — the role is still
 * referenced by organization_members (O8 / V6). Callers surface a friendly
 * "role in use" message.
 */
export class RoleInUseError extends Error {
  readonly status = 409 as const;
  constructor(message = "Role is still assigned to members") {
    super(message);
    this.name = "RoleInUseError";
  }
}

/**
 * Thrown by `setRolePermissions` when the BE rejects the bulk write with HTTP
 * 400 (O10 / V2 subset-violation): one or more grants fall outside the org's
 * available matrix. The whole batch is rejected (no partial writes); `offending`
 * carries the violating tuple labels (`"module:submodule:action"`) the BE emits.
 */
export class PermissionSubsetError extends Error {
  readonly status = 400 as const;
  readonly offending: string[];
  constructor(message: string, offending: string[] = []) {
    super(message);
    this.name = "PermissionSubsetError";
    this.offending = offending;
  }
}

/**
 * Pull a human message + offending tuple labels out of the BE 400 body.
 * The BE emits `{type:"permission_subset", message, offending: string[]}` either
 * top-level (global handler) or wrapped in `detail` (HTTPException) — handle both.
 */
function parseSubsetViolation(body: unknown): { message: string; offending: string[] } {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const detail = (root.detail && typeof root.detail === "object" ? root.detail : root) as Record<
    string,
    unknown
  >;
  const message =
    (typeof detail.message === "string" && detail.message) ||
    (typeof root.message === "string" && root.message) ||
    (typeof root.detail === "string" && root.detail) ||
    "Some permissions are not available for this organization";
  const raw = detail.offending ?? detail.invalid ?? root.offending;
  const offending = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  return { message, offending };
}

export const rbacApi = {
  // ── GET /me ─────────────────────────────────────────────────────────────
  /** GET /me — caller's userId + organizationId + role/tier (identity discovery). */
  async getMe(): Promise<MeResponse> {
    const headers = await authHeader();
    return resolveBody<MeResponse>(get({ apiName: API_NAME, path: "/me", options: { headers } }));
  },

  // ── O1: my-permissions ────────────────────────────────────────────────────
  async getMyPermissions(userId: string, orgId: string): Promise<MyPermissionsDto> {
    const headers = await authHeader();
    return resolveBody<MyPermissionsDto>(
      get({ apiName: API_NAME, path: rbacPath(userId, orgId, "/my-permissions"), options: { headers } })
    );
  },

  // ── O2: available-matrix ──────────────────────────────────────────────────
  async getAvailableMatrix(userId: string, orgId: string): Promise<AvailableMatrixDto> {
    const headers = await authHeader();
    return resolveBody<AvailableMatrixDto>(
      get({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, "/available-matrix"),
        options: { headers },
      })
    );
  },

  // ── O3: list system role templates ──────────────────────────────────────────
  async listSystemRoles(userId: string, orgId: string): Promise<RoleDto[]> {
    const headers = await authHeader();
    const res = await resolveBody<RoleListResponse>(
      get({ apiName: API_NAME, path: rbacPath(userId, orgId, "/roles"), options: { headers } })
    );
    return res.data;
  },

  // ── O4: list org-assignable roles (custom + templates) ──────────────────────
  async listOrgRoles(userId: string, orgId: string): Promise<RoleDto[]> {
    const headers = await authHeader();
    const res = await resolveBody<RoleListResponse>(
      get({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, "/roles/organization"),
        options: { headers },
      })
    );
    return res.data;
  },

  // ── O5: get role by id ────────────────────────────────────────────────────
  async getRole(userId: string, orgId: string, roleId: string): Promise<RoleDto> {
    const headers = await authHeader();
    return resolveBody<RoleDto>(
      get({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, `/roles/${encodeURIComponent(roleId)}`),
        options: { headers },
      })
    );
  },

  // ── O6: create org custom role ──────────────────────────────────────────────
  async createRole(userId: string, orgId: string, body: RoleCreateRequest): Promise<RoleDto> {
    const headers = await authHeader();
    return resolveBody<RoleDto>(
      post({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, "/roles"),
        options: { headers, body: body as unknown as Record<string, unknown> as never },
      })
    );
  },

  // ── O7: update org custom role ──────────────────────────────────────────────
  async updateRole(
    userId: string,
    orgId: string,
    roleId: string,
    body: RoleUpdateRequest
  ): Promise<RoleDto> {
    const headers = await authHeader();
    return resolveBody<RoleDto>(
      put({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, `/roles/${encodeURIComponent(roleId)}`),
        options: { headers, body: body as unknown as Record<string, unknown> as never },
      })
    );
  },

  // ── O8: delete org custom role (409 when members reference it) ───────────────
  async deleteRole(userId: string, orgId: string, roleId: string): Promise<void> {
    const headers = await authHeader();
    try {
      await del({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, `/roles/${encodeURIComponent(roleId)}`),
        options: { headers },
      }).response;
    } catch (err: unknown) {
      if (httpStatus(err) === 409) {
        const body = await errorBody(err);
        const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
        const msg =
          (typeof root.detail === "string" && root.detail) ||
          (typeof root.message === "string" && root.message) ||
          undefined;
        throw new RoleInUseError(msg);
      }
      throw err;
    }
  },

  // ── O9: get role permissions ────────────────────────────────────────────────
  async getRolePermissions(
    userId: string,
    orgId: string,
    roleId: string
  ): Promise<PermissionGrantDto[]> {
    const headers = await authHeader();
    const res = await resolveBody<RolePermissionsResponse>(
      get({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, `/roles/${encodeURIComponent(roleId)}/permissions`),
        options: { headers },
      })
    );
    return res.permissions;
  },

  // ── O10: set (bulk-replace) role permissions — subset-validated (400) ────────
  async setRolePermissions(
    userId: string,
    orgId: string,
    roleId: string,
    permissions: PermissionGrantDto[]
  ): Promise<PermissionGrantDto[]> {
    const headers = await authHeader();
    const body: SetRolePermissionsRequest = { permissions };
    try {
      const res = await resolveBody<RolePermissionsResponse>(
        put({
          apiName: API_NAME,
          path: rbacPath(userId, orgId, `/roles/${encodeURIComponent(roleId)}/permissions`),
          options: { headers, body: body as unknown as Record<string, unknown> as never },
        })
      );
      return res.permissions;
    } catch (err: unknown) {
      if (httpStatus(err) === 400) {
        const { message, offending } = parseSubsetViolation(await errorBody(err));
        throw new PermissionSubsetError(message, offending);
      }
      throw err;
    }
  },

  // ── O11: set member role ────────────────────────────────────────────────────
  async setMemberRole(
    userId: string,
    orgId: string,
    memberId: string,
    roleId: string
  ): Promise<UserRoleResponse> {
    const headers = await authHeader();
    const body: SetMemberRoleRequest = { roleId };
    return resolveBody<UserRoleResponse>(
      put({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, `/members/${encodeURIComponent(memberId)}/role`),
        options: { headers, body: body as unknown as Record<string, unknown> as never },
      })
    );
  },

  // ── O13: list actions (global verb catalog) ────────────────────────────────
  // Needed by the matrix to map action NAMES (all the available-matrix exposes)
  // to action IDs (what O10 grant rows require) and back when hydrating.
  async listActions(userId: string, orgId: string): Promise<ActionDto[]> {
    const headers = await authHeader();
    const res = await resolveBody<ActionListResponse>(
      get({ apiName: API_NAME, path: rbacPath(userId, orgId, "/actions"), options: { headers } })
    );
    return res.data;
  },

  // ── O14: check-permission ─────────────────────────────────────────────────
  async checkPermission(
    userId: string,
    orgId: string,
    body: CheckPermissionRequest
  ): Promise<CheckPermissionResponse> {
    const headers = await authHeader();
    return resolveBody<CheckPermissionResponse>(
      post({
        apiName: API_NAME,
        path: rbacPath(userId, orgId, "/check-permission"),
        options: { headers, body: body as unknown as Record<string, unknown> as never },
      })
    );
  },
};
