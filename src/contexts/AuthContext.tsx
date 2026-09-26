import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  updatePassword as amplifyUpdatePassword,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  updateUserAttributes,
  type AuthUser,
} from "aws-amplify/auth";
import { setAccessTokenProvider } from "@/services/authToken";

/**
 * Profile derived from Cognito user attributes.
 *
 * FireCode's backend has NO `/users/{id}/profile` endpoint — it auto-provisions
 * the user/org/owner-role from the JWT claims on the first authenticated call
 * (`get_current_context` in fire-code-be `common/auth/identity.py`, FCR-008/021).
 * So the editable profile lives entirely in Cognito user attributes
 * (`given_name`, `family_name`, `preferred_username`, `email`, `locale`),
 * unlike the POS reference which round-tripped a markets-api profile row.
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  locale: string;
}

interface SignUpArgs {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredUsername: string;
  email: string;
  /** Cognito `locale` attribute (language preference). Defaults to "es". */
  locale?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  /** Cognito attributes for the signed-in user (null until loaded). */
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signUp: (args: SignUpArgs) => Promise<{ needsConfirmation: boolean; userId?: string }>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  /** Persist editable profile attributes to Cognito + refresh the cache. */
  updateProfile: (partial: Partial<Pick<UserProfile, "firstName" | "lastName" | "username">>) => Promise<void>;
  signOut: () => Promise<void>;
  /** Best-effort global sign-out to clear a stale Cognito session before auth flows. */
  forceLogout: () => Promise<void>;
  /** Merge a partial profile update into the cached profile (no refetch). */
  applyProfileUpdate: (partial: Partial<UserProfile>) => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthCtx | null>(null);

function toProfile(attrs: Record<string, string | undefined>): UserProfile {
  return {
    firstName: attrs.given_name ?? "",
    lastName: attrs.family_name ?? "",
    username: attrs.preferred_username ?? "",
    email: attrs.email ?? "",
    locale: attrs.locale ?? "es",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Session restore on mount: hydrate user + Cognito attributes.
  const refresh = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
      try {
        const attrs = await fetchUserAttributes();
        setProfile(toProfile(attrs));
      } catch {
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Best-effort global sign-out — Amplify v6 signIn/signUp throws
  // UserAlreadyAuthenticatedException when a session already exists, so clear
  // any stale session before an auth flow.
  const forceLogout: AuthCtx["forceLogout"] = useCallback(async () => {
    try {
      await amplifySignOut({ global: true });
    } catch {
      // Ignore — there may be no session, or the token may already be invalid.
    }
    setUser(null);
    setProfile(null);
  }, []);

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    // Clear any stale Cognito session first (mirror POS login()).
    try {
      await amplifySignOut();
    } catch {
      /* no session to clear */
    }
    const result = await amplifySignIn({ username: email, password });
    // Unconfirmed users resolve to CONFIRM_SIGN_UP without throwing.
    if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
      return { needsConfirmation: true };
    }
    if (result.isSignedIn) {
      await refresh();
    }
    return { needsConfirmation: false };
  };

  const signUp: AuthCtx["signUp"] = async (args) => {
    const res = await amplifySignUp({
      username: args.username,
      password: args.password,
      options: {
        userAttributes: {
          email: args.email,
          given_name: args.firstName,
          family_name: args.lastName,
          preferred_username: args.preferredUsername,
          locale: args.locale || "es",
        },
      },
    });
    return { needsConfirmation: !res.isSignUpComplete, userId: res.userId };
  };

  const confirmSignUp: AuthCtx["confirmSignUp"] = async (email, code) => {
    await amplifyConfirmSignUp({ username: email, confirmationCode: code });
  };

  const resendCode: AuthCtx["resendCode"] = async (email) => {
    await amplifyResendSignUpCode({ username: email });
  };

  const resetPassword: AuthCtx["resetPassword"] = async (email) => {
    await amplifyResetPassword({ username: email });
  };

  const confirmResetPassword: AuthCtx["confirmResetPassword"] = async (email, code, newPassword) => {
    await amplifyConfirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
  };

  const updatePassword: AuthCtx["updatePassword"] = async (oldPassword, newPassword) => {
    await amplifyUpdatePassword({ oldPassword, newPassword });
  };

  const applyProfileUpdate: AuthCtx["applyProfileUpdate"] = useCallback((partial) => {
    setProfile((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  // Persist editable attributes to Cognito (email is NOT editable here — it is
  // the sign-in identity / verified attribute). Then sync the cache live.
  const updateProfile: AuthCtx["updateProfile"] = async (partial) => {
    const userAttributes: Record<string, string> = {};
    if (partial.firstName !== undefined) userAttributes.given_name = partial.firstName;
    if (partial.lastName !== undefined) userAttributes.family_name = partial.lastName;
    if (partial.username !== undefined) userAttributes.preferred_username = partial.username;
    await updateUserAttributes({ userAttributes });
    applyProfileUpdate(partial);
  };

  const signOut: AuthCtx["signOut"] = async () => {
    await amplifySignOut();
    setUser(null);
    setProfile(null);
  };

  const getAccessToken: AuthCtx["getAccessToken"] = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, []);

  // FCR-010: expose the access-token accessor to the plain API module so
  // authenticated calls (fireCodeApi.evaluate) can attach the Bearer header.
  useEffect(() => {
    setAccessTokenProvider(getAccessToken);
  }, [getAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        confirmSignUp,
        resendCode,
        resetPassword,
        confirmResetPassword,
        updatePassword,
        updateProfile,
        signOut,
        forceLogout,
        applyProfileUpdate,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
