import { createHash } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The administrator email is reduced to a SHA-256 fingerprint at BUILD time,
  // so the address itself never appears in the public JavaScript bundle.
  // (Real authorisation is still the admins/{uid} record + Firestore rules.)
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const adminEmail = (env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
  const adminEmailSha256 = adminEmail ? createHash('sha256').update(adminEmail).digest('hex') : '';

  return {
  define: {
    __ADMIN_EMAIL_SHA256__: JSON.stringify(adminEmailSha256)
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
