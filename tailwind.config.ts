import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import preset from "@pacific-code-labs/fire-code-design-system/tailwind-preset";

// Theme (token colors, radius, animations) comes from the design system preset; the DS ships
// TS source, so its files are scanned too (preset.dsContent).
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{ts,tsx}", ...preset.dsContent],
  plugins: [typography],
} satisfies Config;
