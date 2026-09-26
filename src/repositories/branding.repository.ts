// The ONLY import site for branding content (landing-dxp-builder §4/§10).
import branding from "@/content/branding.json";

export type BrandingContent = typeof branding;

export const getBranding = (): BrandingContent => branding;
