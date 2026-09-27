/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_COGNITO_IDENTITY_POOL_ID?: string;
  readonly VITE_COGNITO_USER_POOL_ID?: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID?: string;
  /** Marketing landing (fire-code.jcampos.dev); SSM site/landing-url. */
  readonly VITE_LANDING_URL?: string;
  /** Anonymous published-content API (public-api.sokol.jcampos.dev); SSM public-api/url. */
  readonly VITE_PUBLIC_API_URL?: string;
  /** Identity pool whose guests may read published content; SSM public-api/identity-pool-id. */
  readonly VITE_PUBLIC_IDENTITY_POOL_ID?: string;
  /** Support service (tickets) API; SSM support/url. */
  readonly VITE_SUPPORT_API_URL?: string;
  /** AppSync Events realtime endpoints; SSM events/http-url + events/realtime-url. */
  readonly VITE_EVENTS_HTTP_URL?: string;
  readonly VITE_EVENTS_REALTIME_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
