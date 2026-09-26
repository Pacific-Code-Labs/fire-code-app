/**
 * The reference a backend 5xx carries (fire_code_common.observability): the `X-Request-Id`
 * header, or `reference` in the JSON body. Users quote it in "Report this problem" and support
 * finds the matching incident with it.
 */
export function errorReference(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const response = (err as { response?: { headers?: unknown; body?: unknown } }).response;
  const headers = response?.headers;
  if (headers) {
    if (typeof (headers as Headers).get === "function") {
      const value = (headers as Headers).get("x-request-id");
      if (value) return value;
    } else {
      const rec = headers as Record<string, string>;
      const hit = Object.keys(rec).find((k) => k.toLowerCase() === "x-request-id");
      if (hit && rec[hit]) return rec[hit];
    }
  }
  const body = response?.body;
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    const ref = (parsed as { reference?: unknown } | undefined)?.reference;
    return typeof ref === "string" && ref ? ref : undefined;
  } catch {
    return undefined;
  }
}
