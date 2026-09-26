// Media library types + asset-ref resolvers (landing-dxp-builder §11).
//
// `media.json` is the registry of every image/video/audio the site uses. Each
// item stores either a root-relative `path` (source:"local", lives under
// public/) or an absolute `url` (source:"external"). Content fields store a
// single string REF (path or url); the public side resolves it through these
// helpers. This is what makes any image re-pointable from the admin without
// touching code (no `import logo from "./logo.png"`).
//
// `media.ts` is import-safe in the PUBLIC bundle (the resolvers are used by
// public components/SEO); the admin-only MUTATORS live in `media-upload.ts`.
import seo from "@/content/seo.json";

export type MediaKind = "image" | "video" | "audio";
export type MediaSource = "local" | "external";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  source: MediaSource;
  /** root-relative for local items (e.g. "/media/hero.webp"); omit for external. */
  path?: string;
  /** absolute URL for external items; omit for local. */
  url?: string;
  filename: string;
  mime: string;
  size: number;
  alt: { es: string; en: string };
  createdAt: string;
}

export interface MediaLibrary {
  items: MediaItem[];
}

/** Vite base without a trailing slash: "" for "/", "/repo" for "/repo/". */
const basePrefix = (): string => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

/**
 * Any stored ref (a media path/url OR a branding asset field) → a usable
 * src/href. Absolute/data URLs pass through; root-relative paths get the Vite
 * base prefix so the same content works on a custom domain or a subpath.
 */
export function resolveAssetUrl(ref?: string | null): string {
  if (!ref) return "";
  if (/^(https?:)?\/\//i.test(ref) || ref.startsWith("data:")) return ref;
  return ref.startsWith("/") ? basePrefix() + ref : ref;
}

/** A library item → a displayable src. */
export const resolveMediaUrl = (i: MediaItem): string =>
  i.source === "external" ? resolveAssetUrl(i.url) : resolveAssetUrl(i.path);

/**
 * The value to STORE in a content field when an item is picked. Empty-string
 * aware: prefer the key matching `source`, fall back to whichever is truthy
 * (items may carry BOTH path and url), and never return undefined.
 */
export const mediaRef = (i: MediaItem): string =>
  (i.source === "external" ? i.url : i.path) ?? i.url ?? i.path ?? "";

/**
 * Absolute URL for OG / Twitter / sitemap / JSON-LD — joins seo.json `siteUrl`
 * + the Vite base + the ref's path. Pass-through for already-absolute refs.
 */
export function absoluteAssetUrl(ref?: string | null): string {
  if (!ref) return "";
  if (/^https?:\/\//i.test(ref) || ref.startsWith("data:")) return ref;
  const site = (seo.siteUrl ?? "").replace(/\/$/, "");
  return site + basePrefix() + (ref.startsWith("/") ? ref : `/${ref}`);
}

/** Infer a media kind from a MIME type (used by the upload registrar). */
export function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "image";
}
