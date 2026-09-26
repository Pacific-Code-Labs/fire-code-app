import { useLocation } from "react-router-dom";

/**
 * Wraps page content and re-applies the ".page-enter" animation class on every
 * location.pathname change. Keying the wrapper <div> by pathname forces React
 * to remount it, which restarts the CSS animation. The animation itself is a
 * no-op under prefers-reduced-motion (see src/index.css).
 *
 * No framer-motion — pure CSS + a remount key.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}

export default PageTransition;
