import { Link, useLocation } from "react-router-dom";
import { LifeBuoy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { localizedPath, stripLangPrefix } from "@/lib/paths";

/** "Report this problem": opens a support request prefilled with the error reference. */
export function ReportProblemLink({ reference, category = "general" }: { reference: string; category?: string }) {
  const { user } = useAuth();
  const { lang, tr } = useLang();
  const { pathname } = useLocation();
  if (!user) return null; // guests (public demo) have no support area
  const params = new URLSearchParams({ reference, category, from: stripLangPrefix(pathname).rest });
  return (
    <Link
      to={`${localizedPath(lang, "/support/new")}?${params}`}
      className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
    >
      <LifeBuoy className="h-3.5 w-3.5" /> {tr.support_report}
    </Link>
  );
}
