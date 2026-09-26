// Flatten / unflatten helpers for the Translations key-table (landing-dxp-builder).
// Convert a nested translation object to/from a dot-notation string map.

export function flatten(obj: unknown, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
      else out[key] = String(v ?? "");
    }
  }
  return out;
}

export function unflatten(map: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [flatKey, value] of Object.entries(map)) {
    const parts = flatKey.split(".");
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (typeof node[p] !== "object" || node[p] === null) node[p] = {};
      node = node[p] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}
