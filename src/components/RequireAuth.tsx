import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShellSkeleton } from "@pacific-code-labs/fire-code-design-system";
import { useLang } from "@/contexts/LangContext";
import { localizedPath, persistedLang, stripLangPrefix } from "@/lib/paths";

interface RequireAuthProps {
  children: ReactNode;
  /**
   * Optional Cognito group gate. When provided, the signed-in user must belong
   * to at least one of these groups (read from the access token's
   * `cognito:groups` claim). Forbidden users are redirected to `/dashboard`.
   * Omit for any-authenticated-user routes. Org-scoped RBAC (FCR-061) layers on
   * top of this later.
   */
  roles?: string[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const { tr } = useLang();

  // The session is resolving: show the shell's shape, never a centred spinner.
  if (loading) return <ShellSkeleton label={tr.loading} />;

  if (!user) {
    // redirectAfterLogin: stash the intended (already lang-prefixed) path so
    // Login can restore it. The /login redirect itself uses the CURRENT url
    // language (falling back to the persisted/default lang).
    const lang = stripLangPrefix(location.pathname).lang ?? persistedLang();
    return (
      <Navigate
        to={localizedPath(lang, "/login")}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (roles && roles.length > 0) {
    // `cognito:groups` is surfaced on the user via the access token claims when
    // present. Profile carries the resolved attributes; groups live on the JWT,
    // so we read them defensively off the AuthUser shape.
    const groups =
      ((user as unknown as { signInUserSession?: { accessToken?: { payload?: { "cognito:groups"?: string[] } } } })
        .signInUserSession?.accessToken?.payload?.["cognito:groups"]) ?? [];
    const allowed = roles.some((r) => groups.includes(r));
    if (!allowed) {
      const lang = stripLangPrefix(location.pathname).lang ?? persistedLang();
      return <Navigate to={localizedPath(lang, "/dashboard")} replace />;
    }
  }

  // `profile` is intentionally allowed to be null here (attributes may still be
  // loading post-restore); the routes themselves tolerate a null profile.
  void profile;

  return <>{children}</>;
}
