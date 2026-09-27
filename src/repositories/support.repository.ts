// Client for the support API (support.sokol.jcampos.dev, sokol-support-be). The tenant
// gateway's Cognito authorizer takes the app pool ID token; the path owner must be the caller.
import { fetchAuthSession } from "aws-amplify/auth";

export const SUPPORT_API_URL = (import.meta.env.VITE_SUPPORT_API_URL ?? "https://support.sokol.jcampos.dev").replace(/\/+$/, "");

export interface SupportMessage {
  id: string;
  author_user_id: string;
  is_staff: boolean;
  body: string;
  created_at: string | null;
}

export interface SupportEvidence {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string | null;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: string;
  incident_reference: string | null;
  created_at: string | null;
  updated_at: string | null;
  messages?: SupportMessage[];
  evidence?: SupportEvidence[];
}

export interface NewTicket {
  subject: string;
  description: string;
  category: string;
  incident_reference?: string;
  context?: Record<string, string>;
}

export class SupportApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SupportApiError";
  }
}

export const EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 5;

async function idToken(forceRefresh: boolean): Promise<string | null> {
  try {
    return (await fetchAuthSession({ forceRefresh })).tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const send = async (forceRefresh: boolean) => {
    const token = await idToken(forceRefresh);
    return fetch(`${SUPPORT_API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };
  let res = await send(false);
  if (res.status === 401) res = await send(true);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const parsed = await res.json();
      if (typeof parsed?.detail === "string") detail = parsed.detail;
    } catch {
      /* not JSON */
    }
    throw new SupportApiError(res.status, detail);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const base = (userId: string) => `/api/users/${encodeURIComponent(userId)}/support/tickets`;

export const supportRepository = {
  list: (userId: string) => call<SupportTicket[]>("GET", base(userId)),
  get: (userId: string, id: string) => call<SupportTicket>("GET", `${base(userId)}/${id}`),
  create: (userId: string, ticket: NewTicket) => call<SupportTicket>("POST", base(userId), ticket),
  reply: (userId: string, id: string, body: string) => call<SupportMessage>("POST", `${base(userId)}/${id}/messages`, { body }),
  evidenceUrl: (userId: string, id: string, evidenceId: string) =>
    call<{ download_url: string }>("GET", `${base(userId)}/${id}/evidence/${evidenceId}/download`),

  /** Presigned PUT straight to the private evidence bucket, then confirm. */
  async attach(userId: string, id: string, file: File): Promise<SupportEvidence> {
    const target = await call<{ id: string; upload_url: string; headers: Record<string, string> }>(
      "POST", `${base(userId)}/${id}/evidence`, { file_name: file.name, content_type: file.type, size_bytes: file.size });
    const res = await fetch(target.upload_url, { method: "PUT", headers: target.headers, body: file });
    if (!res.ok) throw new SupportApiError(res.status, "Upload failed");
    return call<SupportEvidence>("POST", `${base(userId)}/${id}/evidence/${target.id}/complete`);
  },
};
