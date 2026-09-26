import { Amplify } from "aws-amplify";

const region = import.meta.env.VITE_AWS_REGION ?? "us-east-1";
const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID ?? "";
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "";
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID ?? "";
const apiEndpoint = import.meta.env.VITE_API_BASE_URL ?? "https://api.fire-code.jcampos.dev";

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId,
      userPoolId,
      userPoolClientId,
      allowGuestAccess: true,
    },
  },
  API: {
    REST: {
      FireCodeApi: {
        endpoint: apiEndpoint,
        region,
      },
    },
  },
});
