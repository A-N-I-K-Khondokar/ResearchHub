import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  GoogleAuthProvider,
  type Auth
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { ENV } from './env';

const firebaseConfig = {
  apiKey: ENV.firebaseApiKey,
  authDomain: ENV.firebaseAuthDomain,
  projectId: ENV.firebaseProjectId,
  appId: ENV.firebaseAppId,
  messagingSenderId: ENV.firebaseMessagingSenderId
};

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db: Firestore = getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;

