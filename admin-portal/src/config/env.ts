/**
 * Validates and exports Vite environment variables for the Admin Portal.
 */

interface EnvConfig {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  firebaseMessagingSenderId: string;
  adminEmail: string;
  isConfigured: boolean;
}

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cse-research-hub.firebaseapp.com';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cse-research-hub';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
// No fallback: if VITE_ADMIN_EMAIL is missing, nobody is authorised (fail closed).
const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();

export const ENV: EnvConfig = {
  firebaseApiKey: apiKey,
  firebaseAuthDomain: authDomain,
  firebaseProjectId: projectId,
  firebaseAppId: appId,
  firebaseMessagingSenderId: messagingSenderId,
  adminEmail: adminEmail,
  isConfigured: Boolean(apiKey && projectId && adminEmail)
};

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || !ENV.adminEmail) return false;
  return email.toLowerCase().trim() === ENV.adminEmail;
}

