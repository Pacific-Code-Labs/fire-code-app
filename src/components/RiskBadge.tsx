import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/hooks/useProjects";
import { useLang } from "@/contexts/LangContext";
import { cn } from "@/lib/utils";

const STYLES: Record<RiskLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-500 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-500 border-amber-500/30",
  high: "bg-primary/15 text-primary border-primary/30",
};

export function RiskBadge({ level, className }: { level?: RiskLevel; className?: string }) {
  const { tr } = useLang();
  const labels: Record<RiskLevel, string> = {
    low: tr.risk_low,
    medium: tr.risk_medium,
    high: tr.risk_high,
  };
  if (!level) return <Badge variant="outline" className={className}>—</Badge>;
  return (
    <Badge variant="outline" className={cn("border", STYLES[level], className)}>
      {labels[level]}
    </Badge>
  );
}
