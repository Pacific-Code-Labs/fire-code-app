/**
 * authToken — the bridge that lets the API layer (a plain module) obtain the
 * current Cognito **access token** without importing React/AuthContext.
 *
 * FCR-010 (FE action): authenticated API calls must send
 *   Authorization: Bearer <Cognito User Pool ACCESS token>
 * NOT the SigV4-signed Identity Pool request and NOT the id token.
 *
 * `AuthContext.getAccessToken()` is the source of truth; we keep a default
 * provider that reads the session directly via Amplify so the helper works even
 * before any provider registers (e.g. module-load races), and let the app
 * override it with the context's memoized accessor.
 */
import { fetchAuthSession } from "aws-amplify/auth";

export type AccessTokenProvider = () => Promise<string | null>;

const defaultProvider: AccessTokenProvider = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
};

let provider: AccessTokenProvider = defaultProvider;

/** Register the app's access-token accessor (call once, e.g. from AuthContext). */
export function setAccessTokenProvider(p: AccessTokenProvider) {
  provider = p;
}

/** Resolve the current Cognito access token (or null when signed out). */
export function getAccessToken(): Promise<string | null> {
  return provider();
}

/**
 * Build the `Authorization: Bearer <accessToken>` header for an authenticated
 * request, or `{}` when there is no token (Amplify then falls back to SigV4 /
 * guest — which the authorizer rejects with 401 for protected routes, the
 * expected behavior for a signed-out user hitting a guarded endpoint).
 */
export async function authHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
