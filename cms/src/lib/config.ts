export const API_URL = import.meta.env.VITE_API_URL as string;
export const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
export const COGNITO_APP_CLIENT_ID = import.meta.env.VITE_COGNITO_APP_CLIENT_ID as string;
export const COGNITO_REGION = (import.meta.env.VITE_COGNITO_REGION as string) || 'us-east-1';
