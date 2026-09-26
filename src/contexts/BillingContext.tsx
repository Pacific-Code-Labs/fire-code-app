/**
 * BillingContext (FCR-028, card-free) — the self-serve plan/usage surface.
 *
 * Reads the signed-in caller's subscription tier from `GET /me` (via the
 * shared `useMe` hook → `rbacApi.getMe`, cache key ["me"]) and derives the
 * tier's entitlements from the FE plan mirror (`lib/plans.ts`, kept in sync
 * with the BE `src/config/plans.py`). It also surfaces best-effort *usage*:
 *
 *   - saved projects: `used` comes from the authenticated `/projects` list
 *     (the same TanStack Query the dashboard/projects pages read), `cap` from
 *     the plan;
 *   - monthly evaluations: the BE does NOT expose a usage counter on `/me`
 *     today (only the `cap`, plus an `X-Quota-*` 429 on overage), so `used`
 *     stays `null` until a metering endpoint lands (FCR-026/FCR-028 follow-up).
 *
 * NO PayPal / card anything — this is the read-only Free-plan experience.
 * Mount INSIDE `<AuthProvider>` (it depends on the Cognito user) and ABOVE the
 * router so `/pricing` + the dashboard panel can read it.
 */
import { createContext, useContext, ReactNode, useMemo } from "react";
import { useMe } from "@/hooks/useMe";
import { useProjects } from "@/hooks/useProjects";
import { getPlan, type PlanTier, type PlanConfig } from "@/lib/plans";

/** A single metered resource: how much is used vs the plan cap. */
export interface UsageMetric {
  /** Units consumed, or `null` when the BE doesn't expose a counter yet. */
  used: number | null;
  /** Plan cap, or `null` for unlimited. */
  cap: number | null;
}

export interface BillingUsage {
  evaluations: UsageMetric;
  savedProjects: UsageMetric;
}

interface BillingCtx {
  /** Subscription tier (free | pro | enterprise); "free" until /me resolves. */
  tier: PlanTier;
  /** Convenience flag for the (current) only self-serve tier. */
  isFree: boolean;
  /** The resolved plan entitlements for `tier`. */
  plan: PlanConfig;
  /** Best-effort usage vs caps (see file header for which `used` are known). */
  usage: BillingUsage;
  /** True while either /me or the projects list is still loading. */
  loading: boolean;
}

const BillingContext = createContext<BillingCtx | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { tier: rawTier, isLoading: meLoading } = useMe();
  const { projects, loading: projectsLoading } = useProjects();

  const value = useMemo<BillingCtx>(() => {
    const tier = (rawTier as PlanTier) || "free";
    const plan = getPlan(tier);
    return {
      tier,
      isFree: tier === "free",
      plan,
      usage: {
        evaluations: { used: null, cap: plan.monthlyEvaluateQuota },
        savedProjects: { used: projects.length, cap: plan.maxSavedProjects },
      },
      loading: meLoading || projectsLoading,
    };
  }, [rawTier, projects.length, meLoading, projectsLoading]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used within BillingProvider");
  return ctx;
}
