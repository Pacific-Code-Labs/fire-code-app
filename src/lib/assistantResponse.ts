/**
 * Normalizer for the polymorphic assistant response.
 *
 * Backend may return:
 *   { type: "evaluation"   | "message" | "project_created", data: {...} }
 *
 * For backward compatibility, a raw EvaluateResponse (no `type`) is treated
 * as { type: "evaluation", data: <response> }.
 */

import type { EvaluateResponse, NeedsInfoData, ElectricalLoadData } from "@/services/fireCodeApi";

export type { NeedsInfoData, ElectricalLoadData };

export type AssistantResponseType =
  | "evaluation"
  | "message"
  | "project_created"
  | "needs_info"
  | "electrical_load";

/** The project payload nested inside ProjectCreatedData (mirrors BE ProjectResponse). */
export interface ProjectPreview {
  name: string;
  usage?: string;
  buildingType?: string;
  areaM2?: number;
  floors?: number;
  occupants?: number;
  ceilingHeightM?: number;
  volumeM3?: number;
  requirements?: string[];
  reference?: string[];
  contextCr?: Array<string | { topic?: string; detail: string; authority?: string; reference?: string }>;
  risk?: string;
  [k: string]: unknown;
}

/**
 * BE `project_created` payload = { message, projectId, project }. FCR-100:
 * `projectId` is null for the non-persisted DEMO PREVIEW.
 */
export interface ProjectCreatedData {
  message?: string;
  projectId?: string | null;
  project: ProjectPreview;
  [k: string]: unknown;
}

export interface MessageData {
  message: string;
}

export type NormalizedResponse =
  | { type: "evaluation"; data: EvaluateResponse }
  | { type: "message"; data: MessageData }
  | { type: "project_created"; data: ProjectCreatedData }
  | { type: "needs_info"; data: NeedsInfoData }
  | { type: "electrical_load"; data: ElectricalLoadData };

function looksLikeEvaluation(obj: unknown): obj is EvaluateResponse {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    "matchedRules" in o ||
    "requirements" in o ||
    "reference" in o ||
    "contextCr" in o ||
    "risk" in o
  );
}

export function normalizeAssistantResponse(raw: unknown): NormalizedResponse {
  if (raw && typeof raw === "object" && "type" in (raw as object)) {
    const { type, data } = raw as { type: AssistantResponseType; data: unknown };
    switch (type) {
      case "message":
        return { type: "message", data: (data as MessageData) ?? { message: "" } };
      case "project_created":
        return {
          type: "project_created",
          data: (data as ProjectCreatedData) ?? { project: { name: "" } },
        };
      case "needs_info":
        return {
          type: "needs_info",
          data: (data as NeedsInfoData) ?? { questions: [], context: {} },
        };
      case "electrical_load":
        return {
          type: "electrical_load",
          data: (data as ElectricalLoadData) ?? ({} as ElectricalLoadData),
        };
      case "evaluation":
        return { type: "evaluation", data: data as EvaluateResponse };
      default:
        // Unknown — fall through to evaluation guess
        break;
    }
  }
  // Backward compat: treat as evaluation
  if (looksLikeEvaluation(raw)) {
    return { type: "evaluation", data: raw };
  }
  // Last resort: stringify into a plain message
  return {
    type: "message",
    data: { message: typeof raw === "string" ? raw : JSON.stringify(raw) },
  };
}
