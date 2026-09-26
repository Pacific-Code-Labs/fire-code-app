import type { LucideIcon } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { pickLang } from "@/lib/content-lang";
import { resolveIcon } from "@/lib/icons";
import { resolveAssetUrl } from "@/lib/media";
import { getBranding } from "@/repositories/branding.repository";

export interface BrandingVM {
  companyName: string;
  companySuffix: string;
  LogoIcon: LucideIcon;
  /** Resolved logo image src (light/dark); empty when none uploaded → icon fallback. */
  logoUrl: string;
  logoUrlDark: string;
  /** Standalone symbol (L3); empty → icon fallback. */
  markUrl: string;
  tagline: string;
}

export function getBrandingVM(lang: Lang): BrandingVM {
  const b = getBranding();
  return {
    companyName: b.companyName,
    companySuffix: b.companySuffix,
    LogoIcon: resolveIcon(b.logoIconName),
    logoUrl: resolveAssetUrl(b.logoUrl),
    logoUrlDark: resolveAssetUrl(b.logoUrlDark),
    // Optional in older published documents: tolerate a missing field.
    markUrl: resolveAssetUrl((b as { markUrl?: string }).markUrl),
    tagline: pickLang(b.tagline, lang),
  };
}
