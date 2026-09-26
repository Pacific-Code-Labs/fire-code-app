/**
 * Plan/tier mirror (FCR-024 / FCR-028) — the FE projection of the BE
 * `src/config/plans.py` entitlements. Keep these numbers in lockstep with the
 * backend; they drive the Pricing page cards + the dashboard "Current plan"
 * usage caps. `null` means unlimited.
 *
 * NO prices / PayPal here — paid tiers are "coming soon" (FCR-027 deferred).
 * Only the **Free** numbers are owner-final; Pro/Enterprise are placeholders
 * mirrored from the BE for display continuity.
 */
export type PlanTier = "free" | "pro" | "enterprise";

export interface PlanConfig {
  tier: PlanTier;
  /** Monthly AI evaluations; null = unlimited. */
  monthlyEvaluateQuota: number | null;
  /** Saved projects cap; null = unlimited. */
  maxSavedProjects: number | null;
  /** Included seats. */
  seats: number;
  /** Whether this tier is self-serve today (only Free, card-free). */
  selfServe: boolean;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: "free",
    monthlyEvaluateQuota: 20,
    maxSavedProjects: 3,
    seats: 1,
    selfServe: true,
  },
  pro: {
    tier: "pro",
    monthlyEvaluateQuota: 500,
    maxSavedProjects: 100,
    seats: 1,
    selfServe: false,
  },
  enterprise: {
    tier: "enterprise",
    monthlyEvaluateQuota: null,
    maxSavedProjects: null,
    seats: 5,
    selfServe: false,
  },
};

export const PLAN_ORDER: PlanTier[] = ["free", "pro", "enterprise"];

export function getPlan(tier: string): PlanConfig {
  return PLANS[(tier as PlanTier)] ?? PLANS.free;
}
