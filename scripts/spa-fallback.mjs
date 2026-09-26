// GitHub Pages serves 404.html for unknown paths; make it the SPA so deep links
// (/es/projects/<id>) load the app, which then routes client-side.
import { copyFileSync } from "node:fs";
copyFileSync("dist/index.html", "dist/404.html");
console.log("dist/404.html <- dist/index.html (SPA fallback)");
