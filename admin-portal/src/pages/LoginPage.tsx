import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, AlertTriangle, Info, Loader2, UserCheck, Users, History } from 'lucide-react';
import { ENV } from '../config/env';

/** Google "G" mark (official four colours). */
const GoogleMark: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/**
 * Admin sign-in: sky / cloud backdrop with a soft glass card.
 * Google-only (admin access is tied to the `admins/{uid}` record).
 */
export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading, error, setupRequired, attemptedUserUid, attemptedUserEmail, clearError } = useAuth();

  return (
    <main className="login-bg">
      <div className="login-brand">
        <span className="login-brand-mark">
          <GraduationCap size={19} aria-hidden="true" />
        </span>
        CSE Research Hub
      </div>

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-icon">
          <LogIn size={26} aria-hidden="true" />
        </div>

        <h1 id="login-title" className="login-title">Sign in to Admin</h1>
        <p className="login-sub">
          Review new researchers, manage accounts and keep the CSE community safe.
        </p>

        {error ? (
          <div className="login-alert is-error" role="alert">
            <AlertTriangle size={17} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              {error}
              <div>
                <button type="button" className="login-link" onClick={clearError}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {setupRequired && attemptedUserUid ? (
          <div className="login-alert is-info" role="status">
            <Info size={17} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-brand)' }} />
            <div>
              <strong>One more setup step.</strong> This Google account isn't registered as an administrator yet. In the{' '}
              <strong>Firebase Console</strong> → <strong>Firestore Database</strong>, create <code>admins/{attemptedUserUid}</code> with
              the field <code>email: "{attemptedUserEmail}"</code>, then sign in again.
            </div>
          </div>
        ) : null}

        <button type="button" className="login-primary" onClick={signInWithGoogle} disabled={loading} aria-busy={loading || undefined}>
          {loading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <span className="login-g">
              <GoogleMark />
            </span>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <div className="login-divider" aria-hidden="true">What you can do</div>
        <ul className="login-points" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li className="login-point">
            <UserCheck size={18} aria-hidden="true" />
            Review applicants
          </li>
          <li className="login-point">
            <Users size={18} aria-hidden="true" />
            Manage users
          </li>
          <li className="login-point">
            <History size={18} aria-hidden="true" />
            Audit decisions
          </li>
        </ul>

        {/* Never reveal the project id or administrator address on a public page */}
        <div className="login-foot">
          {ENV.adminConfigured ? 'For CSE department administrators only.' : 'Administrator access is not configured yet.'}
        </div>
      </section>
    </main>
  );
};
