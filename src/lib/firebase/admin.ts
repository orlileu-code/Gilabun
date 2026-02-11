import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

export function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0] as App;
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, or FIREBASE_ADMIN_PRIVATE_KEY in .env.local"
    );
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;
  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
    storageBucket
  });
  return adminApp;
}

export function getAdminFirestore() {
  getAdminApp();
  return getFirestore();
}

/** Current user id for server actions. Use "demo" when no auth, or verify ID token later. */
export function getUserId(): string {
  return process.env.FIREBASE_DEMO_USER_ID || "demo";
}
