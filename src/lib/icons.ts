import {
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  BookOpen,
  MapPin,
  MessageSquare,
  Printer,
  Layers,
  Clock,
  AlertTriangle,
  BookOpenCheck,
  Sparkles,
  Bot,
  Workflow,
  Flame,
  Settings,
  Boxes,
  Activity,
  Image,
  Search,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon registry (landing-dxp-builder §5). Icons are editable content: content
 * JSON stores an `iconName` string from this FIXED set and resolves it here, so
 * an admin can pick from a known list and components never hardcode an
 * icon-per-id switch. Extend the map (not a component) to add an icon.
 */
export const ICONS = {
  "arrow-right": ArrowRight,
  "shield-check": ShieldCheck,
  zap: Zap,
  "file-text": FileText,
  "book-open": BookOpen,
  "map-pin": MapPin,
  "message-square": MessageSquare,
  printer: Printer,
  layers: Layers,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  "book-open-check": BookOpenCheck,
  sparkles: Sparkles,
  bot: Bot,
  workflow: Workflow,
  flame: Flame,
  settings: Settings,
  boxes: Boxes,
  activity: Activity,
  image: Image,
  search: Search,
} as const;

export type IconName = keyof typeof ICONS;

export function resolveIcon(name: string): LucideIcon {
  return ICONS[name as IconName] ?? ICONS.sparkles;
}

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
