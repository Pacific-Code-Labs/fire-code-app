# fire-code-app

The signed-in FireCode CR product at **https://app.fire-code.jcampos.dev**: NFPA fire-protection
guidance for Costa Rica, an AI evaluator, projects (incl. electrical load studies), roles, profile,
plans and the Support area. The public demo lives on the landing (`fire-code.jcampos.dev/es/demo`).

Part of the `Fire-Code-CR` workspace (`fe/app`); the marketing landing is `fire-safety-advisor`
(`fire-code.jcampos.dev`) and the admin console is `fire-code-admin` (private).

## Run locally

```bash
pnpm install
eval "$(bash scripts/load-env-from-ssm.sh dev PACIFIC-PROD --print-exports)"   # SSM /fire-code/dev/web/*
pnpm dev            # http://127.0.0.1:5174/es
```

Or start everything from the workspace root: `./reboot-server.sh`.

## Build

`pnpm build` runs the i18n check, the hard-coded-text check, the typecheck, the Vite build and the
SPA 404 fallback. CI (`.github/workflows/deploy-pages.yml`) loads the config from SSM through a
read-only OIDC role and deploys to GitHub Pages on every push to `main`.

See `CLAUDE.md` for the architecture and rules.
