import { getApps, initializeApp, cert } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK once (singleton pattern)
function initFirebaseAdmin() {
  if (getApps().length) return;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase credentials in environment variables");
    }

    // Clean up quotes and literal backslash escapes often introduced by Azure config settings
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } catch (error) {
    console.error("Firebase admin initialization failed:", error);
  }
}

export async function checkMaintenanceMode(): Promise<boolean> {
  initFirebaseAdmin();

  try {
    const db = getFirestore();
    const docSnap = await db.collection("maintenance").doc("mode").get();
    if (docSnap.exists) {
      return docSnap.data()?.leadlens_admin_erp === true;
    }
  } catch (error) {
    console.error("Firestore maintenance check failed:", error);
  }
  return false;
}
