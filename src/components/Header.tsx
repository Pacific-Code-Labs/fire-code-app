import { Languages, Home, LayoutDashboard, LogIn, LogOut, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@pacific-code-labs/fire-code-design-system";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { tChrome } from "@/lib/chrome-i18n";
import { getBrandingVM } from "@/services/branding.service";
import { localizedPath, runLangSwitch, stripLangPrefix } from "@/lib/paths";
import { landingHref } from "@/lib/site-links";

interface HeaderProps {
  chatButton?: React.ReactNode;
}

export function Header({ chatButton }: HeaderProps) {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const onDemo = stripLangPrefix(pathname).rest.startsWith("/demo");
  const [mobileOpen, setMobileOpen] = useState(false);

  const chrome = tChrome(lang);
  const brand = getBrandingVM(lang);
  const nextLang = lang === "es" ? "en" : "es";

  const closeMobile = () => setMobileOpen(false);

  // Language toggle navigates to the same page under the other lang prefix
  // (wrapped in the lang animation). LangLayout's effect then syncs the context.
  const switchLang = () => {
    const { rest } = stripLangPrefix(pathname);
    runLangSwitch(navigate, localizedPath(nextLang, rest));
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container flex h-16 items-center justify-between">
        <Link to={localizedPath(lang, "/")} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/30 glow-red overflow-hidden">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <brand.LogoIcon className="h-5 w-5 text-primary" aria-hidden />
            )}
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">{brand.companyName} <span className="text-primary">{brand.companySuffix}</span></div>
            <div className="text-xs text-muted-foreground hidden sm:block">{brand.tagline}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {onDemo && (
            <Button asChild variant="ghost" size="sm" className="gap-2 hidden sm:inline-flex">
              <a href={landingHref(lang)}>
                <Home className="h-4 w-4" />
                {chrome.nav.home}
              </a>
            </Button>
          )}
          {chatButton}
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-2 hidden sm:inline-flex">
                <Link to={localizedPath(lang, "/dashboard")}>
                  <LayoutDashboard className="h-4 w-4" />
                  {chrome.nav.dashboard}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hidden sm:inline-flex"
                onClick={async () => { await signOut(); navigate(localizedPath(lang, "/")); }}
              >
                <LogOut className="h-4 w-4" />
                {chrome.nav.signOut}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm" className="gap-2 hidden sm:inline-flex">
              <Link to={localizedPath(lang, "/login")}>
                <LogIn className="h-4 w-4" />
                {chrome.nav.signIn}
              </Link>
            </Button>
          )}
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={switchLang}
            className="gap-2"
          >
            <Languages className="h-4 w-4" />
            {chrome.nav.langSwitchTo}
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="sm:hidden" aria-label={chrome.nav.openMenu}>
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <brand.LogoIcon className="h-4 w-4 text-primary" aria-hidden />
                  {brand.companyName} <span className="text-primary">{brand.companySuffix}</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                <Button asChild variant="ghost" className="justify-start gap-2" onClick={closeMobile}>
                  <a href={landingHref(lang)}>
                    <Home className="h-4 w-4" />
                    {chrome.nav.home}
                  </a>
                </Button>
                {user ? (
                  <>
                    <Button asChild variant="ghost" className="justify-start gap-2" onClick={closeMobile}>
                      <Link to={localizedPath(lang, "/dashboard")}>
                        <LayoutDashboard className="h-4 w-4" />
                        {chrome.nav.dashboard}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start gap-2"
                      onClick={async () => { closeMobile(); await signOut(); navigate(localizedPath(lang, "/")); }}
                    >
                      <LogOut className="h-4 w-4" />
                      {chrome.nav.signOut}
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="ghost" className="justify-start gap-2" onClick={closeMobile}>
                    <Link to={localizedPath(lang, "/login")}>
                      <LogIn className="h-4 w-4" />
                      {chrome.nav.signIn}
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
