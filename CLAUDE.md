# CLAUDE.md — `fire-code-app` (FireCode CR signed-in app)

Guidance for AI agents (and humans) working in this repo. Read this before making changes.
The workspace contract (repos, domains, SSM keys, deploy order) is in the root
`Fire-Code-CR/CLAUDE.md`.

---

## 1. Purpose

`fire-code-app` is the **signed-in FireCode CR product** at **`https://app.fire-code.jcampos.dev`**:
auth screens, dashboard, AI evaluator, projects (incl. electrical), roles (RBAC), profile, pricing /
upgrade, the Support area, and the public, throttled **`/demo`** (no sign-in needed). It helps interpret
**NFPA fire-protection standards for Costa Rica** against the `fire-code-cr-be` API
(**`https://api.fire-code.jcampos.dev`**; the old `api.fire-code.jcampos.dev` name is transitional).

It was split out of `fire-safety-advisor` (app-separation):

| Site | Repo | Host |
|---|---|---|
| marketing landing | `fire-safety-advisor` (public) | `fire-code.jcampos.dev` — links here in a new tab |
| **this app** | `fire-code-app` (public) | `app.fire-code.jcampos.dev` |
| admin console + online CMS | `fire-code-admin` (private) | `admin.fire-code.jcampos.dev` |

There is **no landing page and no admin code here**: `/:lang` redirects to `dashboard`
(`RequireAuth` sends guests to `login`), and links to the marketing site use
`lib/site-links.ts` `landingHref()` (`VITE_LANDING_URL`).

---

## 2. Tech stack

- **React 18 + TypeScript + Vite** (SWC plugin). Path alias `@` → `src` (configured in `vite.config.ts` and `tsconfig`).
- **Tailwind CSS + shadcn/ui** — the brand-neutral shadcn primitives now ship from the DS package; only the API-divergent/branded + app-specific set remains under `src/components/ui/*` (config in `components.json`, `tailwind.config.ts`). See §10.
- **`@pacific-code-labs/fire-code-design-system`** (FCR-003 / FCR-086) — shared brand primitives + theme engine, consumed from **GitHub Packages** (`^0.1.1`, registry dep + `.npmrc`). Supplies both the canonical branded primitives and the absorbed shadcn set; see §10.
- **TanStack Query** for server state (`QueryClient` in `App.tsx`).
- **AWS Amplify v6** for auth + the REST API binding.
- **react-router-dom v6** for routing.
- **react-hook-form + zod** for forms; **sonner** + shadcn toaster for toasts; **lucide-react** icons; **recharts** for charts.
- **pnpm** is the package manager (`packageManager` in package.json); Node 24 in CI.
- **Vitest** + Testing Library + jsdom for tests (`src/test/setup.ts`).

Commands: `pnpm dev` (port 5174), `pnpm build`, `pnpm typecheck`, `pnpm check:i18n`, `pnpm check:text`, `pnpm lint`, `pnpm test`.

---

## 3. Structure

```
src/
├── main.tsx                 # entry — MUST import "./config/amplify" first (configures Amplify before any API call)
├── App.tsx                  # providers + routes (see provider order below)
├── index.css                # design-token system (see §6)
├── config/
│   └── amplify.ts           # Amplify.configure: Cognito (guest access) + REST API "FireCodeApi"
├── pages/                   # route screens: Index (public demo), Login, Dashboard, Evaluator,
│                            #   Projects, NewProject, ProjectDetail, NotFound
├── components/
│   ├── ui/                  # shadcn primitives (generated; prefer editing tokens over forking these)
│   ├── assistant/           # assistant message renderers: TextMessage, EvaluationCard, ProjectCard
│   ├── GlobalAssistant.tsx  # floating launcher + slide-over panel (mounts ChatPanel)
│   ├── ChatPanel.tsx        # chat loop: calls fireCodeApi.evaluate, normalizes + renders responses
│   ├── DashboardLayout.tsx, Header.tsx, NavLink.tsx, ThemeToggle.tsx
│   ├── BuildingSelector.tsx, CategoryCard.tsx, RuleDetailModal.tsx, RiskBadge.tsx
│   └── RequireAuth.tsx      # route guard — redirects to /login when no Cognito user
├── services/
│   └── fireCodeApi.ts       # typed API client (see §4)
├── contexts/
│   ├── AuthContext.tsx      # Cognito user pool sign-in/up/confirm/signOut + getAccessToken
│   ├── LangContext.tsx      # bilingual es/en (default "es")
│   ├── ThemeContext.tsx     # light/dark
│   └── AssistantContext.tsx # global assistant open state, message list, input + pageContext
├── hooks/
│   ├── useProjects.ts       # API-backed via TanStack Query (FCR-025): useProjects() list+create/update/remove + useProject(id) detail; hits /projects* (authenticated)
│   ├── use-mobile.tsx, use-toast.ts
├── lib/
│   ├── assistantResponse.ts # response normalizer (see §5)
│   ├── i18n.ts              # translation dictionaries t.es / t.en (see §7)
│   ├── engine.ts, utils.ts  # cn() classname merge
└── data/knowledgeBase.ts    # static reference data
```

**Provider order** (`App.tsx`, outermost → innermost): `QueryClientProvider → ThemeProvider → AuthProvider → LangProvider → AssistantProvider → TooltipProvider → BrowserRouter`. Keep this order; contexts below depend on those above.

**Routes (FCR-106 — ALL language-prefixed under `/:lang/...`):** every route lives under a `<Route path="/:lang" element={<LangLayout/>}>` shell whose `<Outlet/>` renders the matched child (e.g. `/es/demo`, `/en/projects/new`). **The URL drives i18n** — `LangLayout` validates `:lang` (invalid → `<Navigate>` to the default-lang same path) and syncs `LangContext` one-way (URL → context) via `useEffect`; it wraps the outlet in `<PageTransition>` (CSS page-enter animation, no framer-motion). Child routes (leading `/` dropped): index → `<Navigate to="dashboard">`, `demo` Index (public demo, no sign-in). **Auth flow (FCR-060, public):** `login`, `register` (2-step: info+locale → password+strength meter), `verify-email` (OTP `confirmSignUp` → auto sign-in), `forgot-password` + `reset-password` (3-step recovery). Auth-guarded via `RequireAuth`: `dashboard`, `dashboard/evaluator`, `dashboard/profile` (edit name/username + change password), `dashboard/roles` (RBAC roles management, FCR-061), `organizations/new` (thin placeholder — BE auto-provisions), `projects`, `projects/new`, `projects/electrical`, `projects/:id`, plus public `pricing`. Per-lang catch-all `*` → NotFound (keep custom routes above it). **Top-level redirects (outside the lang shell):** `/` → `/<DEFAULT_LANG>` (`"es"`); a bare-path catch-all `*` → `LegacyRedirect` which prepends the persisted (`localStorage "firecode-lang"`) or default lang to the path via `stripLangPrefix` + `localizedPath`. Helpers live in `src/lib/paths.ts` (`localizedPath`/`stripLangPrefix`/`isLang`/`DEFAULT_LANG`/`persistedLang`/`runLangSwitch`). **Every internal link/navigate is built with `localizedPath(lang, "/x")`** (`lang` from `useLang()`); never hardcode a bare in-app path. `RequireAuth` redirects unauthenticated users to `localizedPath(currentUrlLang ?? persisted ?? DEFAULT_LANG, "/login")` and stashes the (already-prefixed) intended path as `state.from`. **`LangContext.setLang` stays PURE (state + localStorage, NEVER navigates — admin-safe);** navigation on language switch is done by callers (`Header`, `DashboardLayout`, `LangLayout`) via `useNavigate` + `localizedPath`. The Header/Dashboard language toggles call `runLangSwitch(navigate, localizedPath(otherLang, rest))` — adds `.lang-anim-out` to the body, navigates after ~220ms, then swaps `.lang-anim-in` (reduced-motion → navigate immediately).

**Org-facing RBAC UI (FCR-061):** ported/adapted from the POS reference onto FireCode libs. Built on `GET /me` (`hooks/useMe.ts`, key `["me"]` → `{userId(Cognito sub), organizationId, role, tier, platformRole}`) which supplies the userId+orgId for the org-scoped RBAC paths `/users/{userId}/organization/{orgId}/rbac/...`. `services/rbacApi.ts` is a typed Bearer-authed client (Amplify `get/post/put/del` on `FireCodeApi`) for `getMe` + O1–O14 (mirrors BE `dtos/rbac_dto.py`/`me_dto.py` in `types/rbac.ts`); it throws `RoleInUseError` on a 409 role delete (O8) and `PermissionSubsetError` on a 400 grant-subset violation (O10, parses the offending tuples). `hooks/useRbac.ts` exposes the queries/mutations (keys `["rbac",...,orgId]`) plus **`usePermissions()`** — `can(module,action,submodule?)`/`hasModule(name)`/`isOwner`/`isAdmin`/`isReady`/`role`, over the flattened `"module:submodule:action"` strings from O1 (the BE pre-expands module-wide grants). **`usePermissions` is FAIL-OPEN while the BE runs `RBAC_ENFORCEMENT=log`** (`can`/`hasModule` return `true` until O1 resolves) so nothing locks out during rollout — there's an explicit `TODO(FCR-029)` to flip it fail-closed in the same change the BE flips to `enforce`. `pages/RolesPage.tsx` (route-gated on `can('admin','read','roles')` once `isReady`) lists system templates (view+duplicate) vs custom org roles (per-verb gated CRUD) + `components/roles/RoleDrawerForm.tsx` + `PermissionMatrix.tsx` (rendered ONLY from the O2 org-filtered available matrix; `grantsFromPermissions`/`grantsToPermissions` expand module-wide `submoduleId:null` rows + drop stale grants + bridge action name↔id via the O13 catalog). Sidebar gating lives in `DashboardLayout.tsx`: `NAV_PERMISSION: Record<NavId,[module,submodule]>` mirrors the seeded catalog 1:1 (dashboard→panel/overview, projects→projects/projects, evaluator→projects/evaluator, roles→admin/roles); `itemVisible(id)=!perm||!isReady||can(module,'read',sub)` hides items, and whole groups hide when empty. Strings bilingual via `rbac_*`/`roles_*`/`nav_roles`/`nav_admin` keys in `lib/i18n.ts`. `lib/rbacI18n.ts` translates catalog modules/submodules/actions/roles by their stable `name` with a server-`displayName` fallback.

**Auth/profile flow (FCR-060):** screens live in `pages/{Login,Register,VerifyEmail,ForgotPassword,ResetPassword,ProfilePage,NewOrganization}.tsx`, built on **`@pacific-code-labs/fire-code-design-system`** primitives (`Button/Input/Select/FormField/OtpInput/Card`) via shared `components/auth/{AuthShell,PasswordField,PasswordStrengthIndicator}.tsx` + zod schemas in `lib/authSchemas.ts`. `AuthContext` (Amplify v6) exposes `signIn/signUp/confirmSignUp/resendCode/resetPassword/confirmResetPassword/updatePassword/updateProfile/forceLogout/applyProfileUpdate` plus session-restore on mount. **Profile is Cognito-attribute-backed** (`given_name/family_name/preferred_username/email/locale` via `fetchUserAttributes`/`updateUserAttributes`) — there is NO BE profile endpoint; the BE auto-provisions the personal org + owner role on the first authenticated call (FCR-008/021), so there's no FE org-create form (the `/organizations/new` page just documents this). All strings bilingual via `lib/i18n.ts` (`auth_*`/`profile_*`/`val_*` keys).

---

## 4. API client — `src/services/fireCodeApi.ts`

Single typed client object `fireCodeApi`:

- `getRules(params?)` → `GET /rules` — rules grouped by category (`RuleGroupDTO[]` + pagination). All filter params optional.
- `getRuleById(ruleId)` → `GET /rules/{id}` — returns `RuleDTO | null` (null on 404 via `isNotFound`).
- `evaluate(request)` → `POST /evaluate` — deterministic filter + AI agent (authenticated). `EvaluateResponse.foundryUsed` indicates whether the AI was reached. On HTTP 429 (monthly evaluate quota, FCR-026) it rethrows a typed **`QuotaError`** (`kind:"evaluate"`).
- `evaluateDemo(request)` → `POST /demo/evaluate` (FCR-047) — PUBLIC, throttled demo evaluation used by the `/demo` page. Sends `demo:true`; the backend forces demo mode (teaser answer, never creates projects) and caps successful AI evals per visitor/day. On HTTP 429 it rethrows a typed **`DemoLimitError`** carrying the `DemoLimitResponse` CTA payload (`type:"demo_limit"`, `message`, `limit`, `cta`, `ctaAction`, `ctaHref`).
- **Projects (FCR-025, authenticated):** `listProjects(params?)` → `GET /projects`, `getProject(id)` → `GET /projects/{id}` (null on 404), `createProject(body)` → `POST /projects`, `updateProject(id,body)` → `PUT /projects/{id}`, `deleteProject(id)` → `DELETE /projects/{id}`. All send `authHeader()`. FE DTOs (`ProjectResponse`/`ProjectListResponse`/`ProjectCreateRequest`/`ProjectUpdateRequest`) mirror the BE `project_dto.py` (camelCase response aliases, lowercase-string `building_type`). `createProject`/`updateProject` rethrow a typed **`QuotaError`** (`kind:"saved_projects"`) on HTTP 402 (saved-projects plan limit, FCR-026). These are consumed via `hooks/useProjects.ts` (TanStack Query) — pages do not call the client directly.

**`QuotaError` (FCR-026):** carries `payload` (`{type:"quota_exceeded",message,limit,current?,resource?,tier?,remaining?,reset?}`), `kind` (`"saved_projects"`|`"evaluate"`), and `status` (`402`|`429`). The body is parsed from the FastAPI `detail`-wrapped or top-level shape; for the 429 evaluate gate, `limit/remaining/reset` are backfilled from the `X-Quota-*` response headers. `components/UpgradeModal.tsx` (DS `Modal`, bilingual) renders it; it's wired into `NewProject.tsx` (create flow) and `ChatPanel.tsx` (authenticated evaluator path — the public demo keeps `DemoLimitError`).

DTOs (`RuleDTO`, `RuleGroupDTO`, `EvaluateResponse`, etc.) mirror the backend contract — keep them in sync with `fire-code-cr-be`. `BuildingType` and `RuleCategory` are numeric enums matching backend IDs.

**Auth today (SigV4):** requests use Amplify's `get`/`post` against the `FireCodeApi` REST binding (`config/amplify.ts`). The Cognito **Identity Pool** with `allowGuestAccess: true` issues anonymous credentials, and Amplify **SigV4-signs** every request — no login required for browsing/evaluating. `AuthContext` separately manages the Cognito **User Pool** (email sign-up/confirm/sign-in) for the saved-projects experience.

> **FCR-010 (Cognito User Pool authorizer) — BACKEND LANDED 2026-06-15.** The backend API Gateway generator (`fire-code-be/scripts/gen_api_template.py`) now declares a Cognito **User Pool** authorizer (`FireCodeCognitoAuthorizer`, `x-amazon-apigateway-authtype: cognito_user_pools`) and classifies each route per-route via a `ROUTE_AUTH` prefix map:
> - **Public (no auth):** `/health`, `/rules*`, `/demo/*` (future), `/webhooks/paypal` (future).
> - **Authenticated (Cognito authorizer):** `/projects*`, `/evaluate`, `/billing*` (future).
>
> **FE action (FCR-060 / FCR-010 FE) — LANDED.** Authenticated calls now send `Authorization: Bearer <Cognito accessToken>` (the User Pool **access token**, NOT the SigV4 request and NOT the id token). Wiring: `services/authToken.ts` holds a swappable access-token provider (defaults to reading the session via Amplify; `AuthContext` registers its memoized `getAccessToken` on mount via `setAccessTokenProvider`); `fireCodeApi.evaluate` calls `authHeader()` and passes the Bearer header in the request `options.headers`. **Public calls (`/rules*`, `/health`, `/demo/*`) send no Authorization header** and keep the SigV4/guest path. `/projects*` is now on the live API (FCR-025) and threads `authHeader()` the same way; future `/billing*` too. The authorizer responds 401 on a missing/invalid token. **Do not silently rip out SigV4** for public/guest browsing — keep the guest path for public routes; update this section + the roadmap row when the FE wiring lands. Note: `/evaluate` is authenticated, so the anonymous demo uses the public `/demo/evaluate` route (FCR-047 — **landed**): the `/demo` page (`Index.tsx`, `embedded=false`) renders `ChatPanel` with the `demo` prop, which calls `fireCodeApi.evaluateDemo` (sends `demo:true` + `context.page:"demo"`) and renders a sign-up CTA (`DemoLimitCard`) on the 429 daily-cap response.

---

## 5. Assistant module

Files: `GlobalAssistant.tsx` (floating launcher + responsive slide-over), `ChatPanel.tsx` (the chat loop), `components/assistant/*` (renderers), `contexts/AssistantContext.tsx` (shared open/message/input/pageContext state), and the normalizer `lib/assistantResponse.ts`.

Flow: user asks → `ChatPanel.ask()` calls `fireCodeApi.evaluate(...)` → raw response passed to `normalizeAssistantResponse(raw)` → rendered by type.

**The 3 response modes** (`NormalizedResponse` in `assistantResponse.ts`). Backend may return `{ type, data }`; a raw `EvaluateResponse` with no `type` is treated as `evaluation` for backward compat; anything else degrades to a `message`.

1. **`evaluation`** — `EvaluateResponse` (matched rules, requirements, references, risk, `foundryUsed`). `contextCr` is now **structured `CrContextItem[] {topic,detail,authority?,reference?}`** (FCR-043); `EvaluationCard` renders topic/detail + an authority·reference suffix and tolerates legacy `string[]`. ChatPanel builds a bilingual summary line. **FCR-042:** `ChatPanel.ask()` sends a trimmed `conversation` (last ~10 turns, mapped from the message list to `{role,content}`) + a `context` `{page, project?}` derived from `AssistantContext.pageContext`. **FCR-044:** it no longer fabricates `building_type`/`usage` defaults — it sends the real selected values or omits them.
2. **`message`** — `{ message: string }`. Plain text via `TextMessage`.
3. **`project_created`** — `ProjectCreatedData` (name, usage, buildingType, keyRequirements…). Rendered with `ProjectCard` + success toast.

**Demo throttle CTA (FCR-047):** `ChatPanel` takes a `demo` prop. When set (the public `/demo` page) `ask()` calls `fireCodeApi.evaluateDemo` and sends `context.page:"demo"` + `demo:true`. On the 429 daily-cap response `evaluateDemo` throws a typed `DemoLimitError`; `ChatPanel` catches it, pushes a `Msg` of type `demo_limit`, and renders the sign-up call-to-action via `components/assistant/DemoLimitCard`. This is an error-path UX (not a `{type,data}` response), so it lives as a `Msg` type + renderer rather than in the `assistantResponse.ts` normalizer.

`Msg` (in `ChatPanel.tsx`) carries `role`, `text`, a `type` discriminator (`message|evaluation|project|error`), and `payload`. The legacy `answer` field is kept for backward compatibility — `renderAssistantBody` falls back to it. Preserve this normalize-then-discriminate shape when extending: add new modes in `assistantResponse.ts` AND a renderer in `components/assistant/`, never inline ad-hoc parsing in `ChatPanel`.

---

## 6. Design-token system — `src/index.css`

All colors are **HSL** and exposed as **semantic CSS custom properties** in `:root` (light) and `.dark` (dark). Categories:

- **Core semantic tokens:** `--background/--foreground`, `--card`, `--popover`, `--primary` (FireCode red `8 90% 54%`) + `--primary-glow`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`; plus gradient/shadow tokens (`--gradient-hero`, `--gradient-panel`, `--shadow-glow`, `--shadow-panel`).
- **`--cat-*`** — the four fire-protection categories: `--cat-initiation`, `--cat-notification`, `--cat-monitoring`, `--cat-actuation` (with `.text-cat-*`, `.bg-cat-*/10`, `.border-cat-*/30` utilities).
- **`--risk-*`** — `--risk-high`, `--risk-medium`, `--risk-low`.
- **`--sidebar-*`** — sidebar surface/foreground/primary/accent/border/ring.

`tailwind.config.ts` maps these tokens to Tailwind colors. **Rule:** never hardcode hex/RGB in components — reference semantic tokens (Tailwind classes or the `.panel`/`.glow-red`/`.text-cat-*` utilities). To restyle, change the token, not the component.

> **Planned migrations:**
> - **FCR-003 — DESIGN SYSTEM WIRED 2026-06-15, REGISTRY-MIGRATED 2026-06-16 (FCR-086).** The shared **`@pacific-code-labs/fire-code-design-system`** package (primitives + runtime theme engine, resolution `override > org > default`) is now a **GitHub Packages registry** dependency (`^0.1.1`; see §10). These same 28-ish token names live in the DS `tokens.css`; this `index.css` stays the **live source of values** (its `:root`/`.dark` blocks win the cascade because the DS stylesheet is imported BEFORE `index.css` in `main.tsx`). Do not fork the token names. The 34 brand-neutral shadcn primitives the DS provides 1:1 were removed from `components/ui/*` and now import from the DS (`import { Button, Card, ... } from "@pacific-code-labs/fire-code-design-system"`); the API-divergent/branded + app-specific set stays local (see §10).

---

## 7. Bilingual (es/en)

`contexts/LangContext.tsx` holds `lang` (default `"es"`), `setLang`, and `tr` = the active dictionary. Use `const { lang, tr } = useLang()` and read `tr.<key>`; for the few inline `lang === "es" ? ... : ...` ternaries (e.g. ChatPanel summaries), prefer dictionary keys over more ternaries.

**FCR-080 (LANDED 2026-06-19) — app strings are now ADMIN-MANAGED JSON, not burned in code.** `lib/i18n.ts` no longer inlines the dictionaries; it imports `src/translations/{es,en}.json` and **flatten-merges** the `app` namespace into the flat `t.es`/`t.en` map (so all `tr.<key>` call sites are unchanged). The `app` namespace is **sectioned**: `common` (the shared bucket for cross-screen strings), `navigation`, `auth`, `profile`, `roles`, `rbac`, `electrical`, `demo`. Keys are globally unique across sections (the merge is lossless). `Dict` is now `Record<string,string>` (the per-key literal type-safety is traded for admin editability — keep keys unique when adding). The landing/marketing chrome stays in the SAME files at top level (`nav`/`demo`/`notFound`) resolved via `lib/chrome-i18n.ts` `tChrome` — untouched by the merge.

These strings are edited in the **`fire-code-admin` Translations page** (dev-server tool: flattens/unflattens `{es,en}.json`, writes back here + git-pushes). To add an app string: add it to the right `app.<section>` object in BOTH `es.json` and `en.json` (or via the admin), then use `tr.<key>`. New cross-screen strings → `app.common`. **Never hardcode user-facing text in components** — the few remaining inline literals (e.g. `BuildingSelector` "Uso" label + placeholders) are the cleanup tail.

---

## 8. Build & deploy

- **Config comes from SSM**, never a committed `.env`: `/fire-code/<env>/web/*` →
  `scripts/load-env-from-ssm.sh` (`--github-env` in CI, `--print-exports` locally:
  `eval "$(bash scripts/load-env-from-ssm.sh dev PACIFIC-PROD --print-exports)"`; the root
  `reboot-server.sh` does this for you). Required: `aws/region`, `api/url`,
  `cognito/{identity-pool-id,user-pool-id,client-id}`. Optional: `site/landing-url`,
  `public-api/{url,identity-pool-id}`, `support/url`, `events/{http-url,realtime-url}`.
  Typed in `src/vite-env.d.ts`.
- **`pnpm build`** = `check:i18n` (es/en keys match, every `tr.<key>` exists, bilingual content
  values complete) → `check:text` (TypeScript-AST scan: fails on hard-coded user-visible text) →
  `tsc` → `vite build` → `spa-fallback.mjs` (`dist/404.html` = the SPA, so deep links load on Pages).
- **CI:** `.github/workflows/deploy-pages.yml` — push to `main` → pnpm + Node 24 → assume
  `secrets.AWS_WEB_BUILD_ROLE_ARN` (read-only OIDC role from `fire-code-infrastructure`
  `web/web-params.yml`) → load SSM → `pnpm build` → GitHub Pages. `public/CNAME` =
  `app.fire-code.jcampos.dev`; `robots.txt` + `<meta robots>` keep it out of search engines.
- **Dev:** `pnpm dev` on `127.0.0.1:5174` (landing 5173, admin 5175).
- **Loading states:** data loading uses the DS skeletons (`ShellSkeleton` in `RequireAuth`,
  `TableSkeleton`, `ListSkeleton`, …), never a centred spinner; secondary forms open in the DS `Drawer`.

---

## 9. Roadmap upkeep — REQUIRED for every change

**`E:\dev\fire-code-app\docs\roadmap\firecode_roadmap.md` is the single source of truth** for tracking all FireCode CR work across every repo (be, fe, agent, admin, design-system). Treat it as a living document. After **any substantive change** in this repo you MUST:

1. **Update the relevant `FCR-NNN` row** in §2 (the status board): set the correct **Status** (`Done` / `In progress` / `Planned` / `Not started` / `Won't do`) and update the **Evidence / next step** cell with what landed and what remains.
2. **Append a dated line to the §5 changelog** describing the change (date + short summary, e.g. `2026-06-15: fire-code-fe — added Bearer-token path to fireCodeApi (FCR-010 prep).`).
3. **Add a new `FCR-NNN` row** for newly discovered work — IDs are stable and never reused/renumbered. When splitting an item, keep the original ID on the parent and add child IDs (note lineage).
4. **Never silently drop scope.** Do not delete rows — strike through or mark `Won't do` with a cited decision source.

FCR IDs most relevant to this repo: **FCR-004** (this CLAUDE.md), **FCR-010** (Cognito JWT authorizer / Bearer auth migration), **FCR-003** (shared design system), **FCR-080** (DXP content model), **FCR-025** (`useProjects` off localStorage onto the API + TanStack Query), **FCR-028** (FE billing UI). If your change touches one of these, update its row in the same commit/PR.

---

## 10. Shared design system

`@pacific-code-labs/fire-code-design-system` is **TypeScript source installed from a git tag**
(`github:Pacific-Code-Labs/fire-code-design-system#v0.2.0`), no registry/token. Tailwind uses its
preset (`tailwind.config.ts`: `presets: [preset]`, `content: [..., ...preset.dsContent]`); `main.tsx`
imports `…/styles` before `index.css` so this app's `index.css` token values win. It also provides
`LanguageProvider`, `AppShell`, the skeleton layouts, `ActivityBar`, `Hint` and the published-content
reader. Local DS work: `pnpm link ../design-system` (drop the resulting `pnpm.overrides` before committing).

---

## 11. Content and texts

- `src/translations/{es,en}.json`: UI chrome. The `app.<section>` objects are flatten-merged into the
  `tr` dictionary (`lib/i18n.ts`), so **keys are unique across sections** (the build checks it).
  New shared strings go to `app.common`. Services stay language-free (return empty copy and let the
  component pick `tr.*`).
- `src/content/*.json` (`branding`, `media`, `seo`, `themes`): editable in the admin console (online
  CMS, site `app`); published documents override the bundled copy at runtime.
- **Never hard-code user-visible text** in components — `pnpm check:text` fails the build.
