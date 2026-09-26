import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Brand identity mark for the assistant — a flame in a fire-orange gradient disc
 * with a soft glow ring. Rendered beside every assistant message + in the
 * welcome / typing states so the agent reads as a consistent persona.
 */
export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br from-primary to-[hsl(var(--primary-glow))] text-primary-foreground",
        "shadow-[var(--shadow-glow)] ring-1 ring-primary/30",
        className,
      )}
      aria-hidden
    >
      <Flame className="h-4 w-4" />
    </div>
  );
}
