import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Button, FormField, Input, OtpInput } from "@pacific-code-labs/fire-code-design-system";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { emailSchema, passwordSchema } from "@/lib/authSchemas";
import { localizedPath } from "@/lib/paths";

const schema = z
  .object({
    email: emailSchema,
    code: z.string().length(6, "val_code_length"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "val_passwords_dont_match",
    path: ["confirmPassword"],
  });
type ResetForm = z.infer<typeof schema>;

export default function ResetPassword() {
  const { confirmResetPassword } = useAuth();
  const { lang, tr } = useLang();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", code: "", newPassword: "", confirmPassword: "" },
  });

  const tErr = (key?: string) => (key ? (tr as Record<string, string>)[key] ?? key : undefined);

  // Prefill the email captured during the forgot-password step.
  useEffect(() => {
    const stored = sessionStorage.getItem("resetPasswordEmail");
    if (stored) reset((prev) => ({ ...prev, email: stored }));
  }, [reset]);

  const newPassword = watch("newPassword") || "";
  const code = watch("code") || "";

  const onSubmit = async (data: ResetForm) => {
    setError(null);
    try {
      await confirmResetPassword(data.email.trim(), data.code, data.newPassword);
      sessionStorage.removeItem("resetPasswordEmail");
      navigate(localizedPath(lang, "/login"), { replace: true });
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name ?? "";
      if (name === "CodeMismatchException") setError(tr.auth_reset_invalid_code);
      else if (name === "ExpiredCodeException") setError(tr.auth_reset_expired_code);
      else setError(e instanceof Error ? e.message : tr.auth_reset_error);
    }
  };

  return (
    <AuthShell
      title={tr.auth_reset_title}
      subtitle={tr.auth_reset_subtitle}
      icon={<Lock className="h-6 w-6" />}
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="text-primary font-medium hover:underline mx-auto"
            onClick={() => navigate(localizedPath(lang, "/forgot-password"))}
          >
            {tr.auth_reset_request_new}
          </button>
          <Link to={localizedPath(lang, "/login")} className="inline-flex items-center gap-1 text-primary font-medium hover:underline mx-auto">
            <ArrowLeft className="h-3.5 w-3.5" />
            {tr.auth_forgot_back_to_login}
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label={tr.auth_reset_email} required error={tErr(errors.email?.message)}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input type="email" placeholder={tr.auth_reset_email_ph} disabled={isSubmitting} {...field} />
            )}
          />
        </FormField>

        <FormField label={tr.auth_reset_code} required error={tErr(errors.code?.message)}>
          <OtpInput
            value={code}
            onChange={(v) => setValue("code", v, { shouldValidate: true })}
            disabled={isSubmitting}
            invalid={!!errors.code}
          />
        </FormField>

        <FormField label={tr.auth_reset_new_password} required error={tErr(errors.newPassword?.message)}>
          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => <PasswordField placeholder={tr.auth_reset_new_password_ph} disabled={isSubmitting} {...field} />}
          />
        </FormField>

        {newPassword && <PasswordStrengthIndicator password={newPassword} />}

        <FormField label={tr.auth_reset_confirm_password} required error={tErr(errors.confirmPassword?.message)}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <PasswordField placeholder={tr.auth_reset_confirm_password_ph} disabled={isSubmitting} {...field} />
            )}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? tr.auth_reset_submitting : tr.auth_reset_submit}
        </Button>
      </form>
    </AuthShell>
  );
}
