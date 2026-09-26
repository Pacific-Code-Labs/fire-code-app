import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button, FormField, Input } from "@pacific-code-labs/fire-code-design-system";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { emailSchema } from "@/lib/authSchemas";
import { localizedPath } from "@/lib/paths";

const schema = z.object({ email: emailSchema });
type ForgotForm = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { lang, tr } = useLang();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ForgotForm>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const tErr = (key?: string) => (key ? (tr as Record<string, string>)[key] ?? key : undefined);

  const onSubmit = async (data: ForgotForm) => {
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(data.email.trim());
      sessionStorage.setItem("resetPasswordEmail", data.email.trim());
      setSentEmail(data.email.trim());
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tr.auth_forgot_error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell
        title={tr.auth_forgot_check_title}
        subtitle={
          <>
            {tr.auth_forgot_check_subtitle} <span className="font-medium text-primary">{sentEmail}</span>
          </>
        }
        icon={<Check className="h-6 w-6" />}
      >
        <div className="flex flex-col gap-3">
          <Button variant="primary" className="w-full" onClick={() => navigate(localizedPath(lang, "/reset-password"))}>
            {tr.auth_forgot_enter_code}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
            {tr.auth_forgot_different_email}
          </Button>
          <Link to={localizedPath(lang, "/login")} className="inline-flex items-center gap-1 text-primary font-medium hover:underline text-sm mx-auto mt-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            {tr.auth_forgot_back_to_login}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={tr.auth_forgot_title}
      subtitle={tr.auth_forgot_subtitle}
      footer={
        <Link to={localizedPath(lang, "/login")} className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          {tr.auth_forgot_back_to_login}
        </Link>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label={tr.auth_forgot_email} required error={tErr(form.formState.errors.email?.message)}>
          <Controller
            control={form.control}
            name="email"
            render={({ field }) => (
              <Input type="email" placeholder={tr.auth_forgot_email_ph} autoFocus disabled={submitting} {...field} />
            )}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? tr.auth_forgot_submitting : tr.auth_forgot_submit}
        </Button>
      </form>
    </AuthShell>
  );
}
