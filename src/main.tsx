import "./config/amplify";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// FCR-003: the shared design-system's token defaults. Imported BEFORE
// index.css so FireCode's index.css (the SOURCE of these same token names)
// wins the cascade and stays the live light/dark values. Both files define
// :root + .dark with equal specificity, so import order is what decides —
// keep this line above index.css. The DS stylesheet only fills in any token
// the app does not redefine.
import "@pacific-code-labs/fire-code-design-system/styles";
import "./index.css";
// FCR-080: apply the active DXP brand theme (themes.json → DS theme engine) +
// favicon (branding.json) once at boot, BEFORE first paint of <App/>. The
// dark/light mode itself is still owned by contexts/ThemeContext, which
// re-applies the theme in the correct mode on toggle.
import { initBrand } from "./lib/brand-theme";

initBrand();

createRoot(document.getElementById("root")!).render(<App />);
