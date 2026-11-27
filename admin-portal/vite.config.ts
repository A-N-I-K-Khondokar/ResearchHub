import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Administrator emails are reduced to SHA-256 fingerprints at BUILD time,
  // so the addresses never appear in the public JavaScript bundle.
  // VITE_ADMIN_EMAIL (one) and VITE_ADMIN_EMAILS (comma-separated) are merged.
  // (Real authorisation is still the admins/{uid} record + Firestore rules.)
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const adminEmails = [env.VITE_ADMIN_EMAIL || '', ...(env.VITE_ADMIN_EMAILS || '').split(',')]
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
  const adminEmailSha256s = [...new Set(adminEmails)].map((e) => createHash('sha256').update(e).digest('hex'));

  return {
  define: {
    __ADMIN_EMAIL_SHA256S__: JSON.stringify(adminEmailSha256s)
  },
  plugins: [react()],
  resolve: {
    dedupe: ['firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore']
  },
  server: {
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          icons: ['lucide-react']
        }
      }
    }
  }
};
});
