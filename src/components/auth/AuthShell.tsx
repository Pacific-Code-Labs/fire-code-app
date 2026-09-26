import { ReactNode } from "react";
import { Flame } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@pacific-code-labs/fire-code-design-system";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * AuthShell — the shared frame for every unauthenticated auth screen
 * (Login / Register / VerifyEmail / ForgotPassword / ResetPassword).
 *
 * Adapts the POS `AuthLayout` to FireCode: centered card, FireCode CR brand
 * lockup, a theme toggle, and DS `Card` primitives. Copy is passed in by the
 * caller (bilingual via LangContext) — this shell hardcodes no user-facing text
 * beyond the brand name.
 */
export function AuthShell({
  title,
  subtitle,
  icon,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional icon node shown in a pill above the title (e.g. a lock). */
  icon?: ReactNode;
  children: ReactNode;
  /** Optional footer area below the card body (links, etc.). */
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] grid place-items-center bg-background px-4 py-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {/* Brand lockup only (not a link): "back" on each screen leads to the landing. */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/30 glow-red">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          <div className="text-lg font-bold tracking-tight">
            FireCode <span className="text-primary">CR</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            {icon && (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-primary">
                {icon}
              </div>
            )}
            <CardTitle className="t-h3">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </CardHeader>
          <CardBody>{children}</CardBody>
        </Card>

        {footer && <div className="mt-5 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
