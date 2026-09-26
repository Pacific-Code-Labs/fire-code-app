/**
 * Assistant capabilities (FCR-118) — the single declarative place that
 * SEPARATES the public **demo** assistant from the signed-in **internal**
 * assistant. Both render the shared `ChatPanel`, but their available functions
 * differ; instead of scattering `demo ? … : …` branches through the chat loop,
 * each variant's capabilities live here so they can be tuned independently.
 *
 * To change what a variant can do, edit its entry below — not ChatPanel.
 */
export type AssistantVariant = "demo" | "internal";

export interface AssistantCapabilities {
  variant: AssistantVariant;
  /**
   * Endpoint: the throttled PUBLIC `/demo/evaluate` (teaser answers, never
   * persists) vs the authenticated `/evaluate` (full evaluation, quota-gated).
   */
  throttledDemoEndpoint: boolean;
  /** Runs the guided 3-step funnel (teaser → full evaluation → project preview). */
  guidedFlow: boolean;
  /** May create/persist real projects (internal) vs preview-only (demo). */
  canCreateProject: boolean;
  /** Surfaces the sign-up call-to-action funnel (demo only). */
  signupFunnel: boolean;
}

export const ASSISTANT_CAPABILITIES: Record<AssistantVariant, AssistantCapabilities> = {
  demo: {
    variant: "demo",
    throttledDemoEndpoint: true,
    guidedFlow: true,
    canCreateProject: false,
    signupFunnel: true,
  },
  internal: {
    variant: "internal",
    throttledDemoEndpoint: false,
    guidedFlow: false,
    canCreateProject: true,
    signupFunnel: false,
  },
};

/** Resolve the capability set for a ChatPanel instance from its `demo` flag. */
export const getAssistantCapabilities = (demo: boolean): AssistantCapabilities =>
  ASSISTANT_CAPABILITIES[demo ? "demo" : "internal"];
