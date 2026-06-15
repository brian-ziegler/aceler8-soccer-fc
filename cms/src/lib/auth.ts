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
    AuthenticationResult?: { AccessToken?: string; IdToken?: string; RefreshToken?: string };
    ChallengeName?: string;
    Session?: string;
  };

  if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    throw Object.assign(new Error('New password required'), {
      code: 'NEW_PASSWORD_REQUIRED',
      session: data.Session,
      email,
    });
  }

  const result = data.AuthenticationResult;
  if (!result?.AccessToken) throw new Error('No authentication result returned');

  storeTokens(result.AccessToken, result.IdToken, result.RefreshToken);
}

function storeTokens(accessToken: string, idToken?: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (idToken) localStorage.setItem(ID_TOKEN_KEY, idToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function completeNewPassword(email: string, session: string, newPassword: string): Promise<void> {
  const endpoint = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge',
    },
    body: JSON.stringify({
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: COGNITO_APP_CLIENT_ID,
      ChallengeResponses: { USERNAME: email, NEW_PASSWORD: newPassword },
      Session: session,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Failed: ${res.status}`);
  }

  const data = await res.json() as {
    AuthenticationResult?: { AccessToken?: string; IdToken?: string; RefreshToken?: string };
  };
  const result = data.AuthenticationResult;
  if (!result?.AccessToken) throw new Error('No authentication result returned');
  storeTokens(result.AccessToken, result.IdToken, result.RefreshToken);
}

export async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  const endpoint = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: COGNITO_APP_CLIENT_ID,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      }),
    });

    if (!res.ok) return false;

    const data = await res.json() as {
      AuthenticationResult?: { AccessToken?: string; IdToken?: string };
    };
    const result = data.AuthenticationResult;
    if (!result?.AccessToken) return false;

    // Refresh flow only returns new access + id tokens (not a new refresh token)
    storeTokens(result.AccessToken, result.IdToken);
    return true;
  } catch {
    return false;
  }
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getIdToken();
}

export function getUserRole(): 'admin' | 'editor' | null {
  const token = getIdToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    const groups = payload['cognito:groups'];
    if (Array.isArray(groups)) {
      if (groups.includes('admin')) return 'admin';
      if (groups.includes('editor')) return 'editor';
    }
  } catch { /* malformed token */ }
  return null;
}

export function getCurrentUserEmail(): string | null {
  const token = getIdToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    return (payload.email as string) ?? null;
  } catch { return null; }
}
