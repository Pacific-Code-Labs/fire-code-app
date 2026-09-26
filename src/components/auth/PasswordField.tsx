import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@pacific-code-labs/fire-code-design-system";
import { useLang } from "@/contexts/LangContext";
import { cn } from "@/lib/utils";

/**
 * PasswordField — a DS `Input` with an inline show/hide toggle.
 *
 * Encapsulates the password-visibility pattern that the POS auth screens
 * repeated inline, so Login/Register/Profile share one accessible control.
 */
export const PasswordField = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, ...rest }, ref) => {
    const { tr } = useLang();
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={show ? "text" : "password"} className={cn("pr-10", className)} {...rest} />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? tr.auth_hide_password : tr.auth_show_password}
          className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";
