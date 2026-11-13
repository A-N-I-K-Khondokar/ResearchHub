import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ShieldCheck, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ENV } from '../config/env';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loading, error, setupRequired, attemptedUserUid, attemptedUserEmail, clearError } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-canvas)',
        padding: '24px 16px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-xl)',
          borderTop: '4px solid var(--color-brand)'
        }}
      >
        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 4px 10px rgba(37,99,235,0.25)'
            }}
          >
            <GraduationCap size={32} />
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            CSE Research Hub
          </h1>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-brand)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShieldCheck size={14} /> Administrative Gateway
          </div>
        </div>

        {/* Informative Guidance */}
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5', marginBottom: '24px' }}>
          Restricted access for authorized departmental administration. Access requires a verified Google account registered in the administrative directory.
        </p>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '20px',
              border: '1px solid rgba(220, 38, 38, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Setup Required Guidance Alert */}
        {setupRequired && attemptedUserUid && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              <Info size={16} color="var(--color-brand)" /> Administrator Bootstrap Required
            </div>
            <div>
              Your Google sign-in was verified, but Cloud Firestore does not yet contain an administrator record for your UID:
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '11.5px',
                background: 'var(--bg-canvas)',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                margin: '8px 0',
                wordBreak: 'break-all',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)'
              }}
            >
              Document ID: {attemptedUserUid}
            </div>
            <div>
              To complete setup, open the <strong>Firebase Console</strong> $\rightarrow$ <strong>Firestore Database</strong>, create document <code>admins/{attemptedUserUid}</code> with field <code>email: "{attemptedUserEmail}"</code>, then retry sign-in.
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="primary"
            onClick={signInWithGoogle}
            loading={loading}
            style={{ width: '100%', padding: '12px 20px', fontSize: '14.5px' }}
          >
            Sign in with Google <ArrowRight size={16} />
          </Button>

          {error && (
            <button
              onClick={clearError}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px', alignSelf: 'center' }}
            >
              Dismiss error
            </button>
          )}
        </div>

        {/* Footer Reference */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: '1.5'
          }}
        >
          <div>Target Project: <code>{ENV.firebaseProjectId}</code></div>
          <div>Authorized Admin: <code>{ENV.adminEmail}</code></div>
        </div>
      </div>
    </div>
  );
};
