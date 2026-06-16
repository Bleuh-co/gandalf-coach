import "server-only";
import { cert, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth as AdminAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore as AdminFirestore } from "firebase-admin/firestore";

declare global {
  // eslint-disable-next-line no-var
  var __gandaCoachAdminApp: App | undefined;
  // eslint-disable-next-line no-var
  var __gandaCoachAdminDb: AdminFirestore | undefined;
  // eslint-disable-next-line no-var
  var __gandaCoachFirestoreSettingsApplied: boolean | undefined;
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  } catch (e) {
    console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON", e);
    return null;
  }
}

export function firebaseAdmin(): App {
  if (globalThis.__gandaCoachAdminApp) return globalThis.__gandaCoachAdminApp;
  const existing = getApps()[0];
  if (existing) {
    globalThis.__gandaCoachAdminApp = existing;
    return existing;
  }
  const sa = getServiceAccount();
  const app = sa
    ? initializeApp({ credential: cert(sa), projectId: sa.project_id })
    : initializeApp({ credential: applicationDefault() });
  globalThis.__gandaCoachAdminApp = app;
  return app;
}

export function adminAuth(): AdminAuth {
  return getAuth(firebaseAdmin());
}

export function adminDb(): AdminFirestore {
  if (globalThis.__gandaCoachAdminDb) return globalThis.__gandaCoachAdminDb;
  const db = getFirestore(firebaseAdmin());
  if (!globalThis.__gandaCoachFirestoreSettingsApplied) {
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch (e: any) {
      console.warn("[firebase-admin] settings() ignoré:", e?.message);
    }
    globalThis.__gandaCoachFirestoreSettingsApplied = true;
  }
  globalThis.__gandaCoachAdminDb = db;
  return db;
}

export function getServiceAccountForGoogle() {
  return getServiceAccount();
}
