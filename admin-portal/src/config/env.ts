/**
 * Validates and exports Vite environment variables for the Admin Portal.
 */

interface EnvConfig {
  firebaseApiKey: string;
  firebaseAuthDomain: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  firebaseMessagingSenderId: string;
  /** True when at least one administrator email fingerprint was configured at build time. */
  adminConfigured: boolean;
  isConfigured: boolean;
}

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cse-research-hub.firebaseapp.com';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cse-research-hub';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
// Only a SHA-256 fingerprint of VITE_ADMIN_EMAIL is compiled in (see vite.config.ts).
// No fallback: if it is missing, nobody is authorised (fail closed).
const adminEmailSha256s: string[] = __ADMIN_EMAIL_SHA256S__;

export const ENV: EnvConfig = {
  firebaseApiKey: apiKey,
  firebaseAuthDomain: authDomain,
  firebaseProjectId: projectId,
  firebaseAppId: appId,
  firebaseMessagingSenderId: messagingSenderId,
  adminConfigured: adminEmailSha256s.length > 0,
  isConfigured: Boolean(apiKey && projectId && adminEmailSha256s.length > 0)
};

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Compares the signed-in email with the configured administrator fingerprints. */
export async function isAuthorizedAdminEmail(email?: string | null): Promise<boolean> {
  if (!email || adminEmailSha256s.length === 0) return false;
  return adminEmailSha256s.includes(await sha256Hex(email.toLowerCase().trim()));
}
