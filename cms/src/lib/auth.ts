import { COGNITO_APP_CLIENT_ID, COGNITO_REGION, COGNITO_USER_POOL_ID } from './config';

const ACCESS_TOKEN_KEY = 'cms_access_token';
const ID_TOKEN_KEY = 'cms_id_token';
const REFRESH_TOKEN_KEY = 'cms_refresh_token';

export async function login(email: string, password: string): Promise<void> {
  const endpoint = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_APP_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
      UserPoolId: COGNITO_USER_POOL_ID,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Auth failed: ${res.status}`);
  }

  const data = await res.json() as {
    AuthenticationResult?: {
      AccessToken?: string;
      IdToken?: string;
      RefreshToken?: string;
    };
  };

  const result = data.AuthenticationResult;
  if (!result?.AccessToken) {
    throw new Error('No authentication result returned');
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, result.AccessToken);
  if (result.IdToken) localStorage.setItem(ID_TOKEN_KEY, result.IdToken);
  if (result.RefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, result.RefreshToken);
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
