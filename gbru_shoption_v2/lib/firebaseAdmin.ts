import 'server-only';
import { getApps, initializeApp, cert } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

import fs from 'fs';
import path from 'path';

function getFirebaseAdminDB() {
  // Bulletproof fallback: manually parse .env.local if Next.js fails to load env variables in dev
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            // Remove wrapping quotes
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            }
            if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            }
            process.env[key] = value;
          }
        });
      }
    } catch (_) {}
  }

  const firebaseProjectID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
  let firebasePrivateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY || '';

  // Clean the private key (replace literal \n with actual newlines)
  if (firebasePrivateKey) {
    // If the key starts and ends with double quotes from env parse, remove them
    if (firebasePrivateKey.startsWith('"') && firebasePrivateKey.endsWith('"')) {
      firebasePrivateKey = firebasePrivateKey.substring(1, firebasePrivateKey.length - 1);
    }
    firebasePrivateKey = firebasePrivateKey.replace(/\\n/g, '\n');
  }

  if (getApps().length === 0) {
    if (!firebaseProjectID || !firebaseClientEmail || !firebasePrivateKey) {
      return null;
    }
    try {
      initializeApp({
        credential: cert({
          projectId: firebaseProjectID,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
      });
    } catch (error) {
      
      return null;
    }
  }
  try {
    return getFirestore();
  } catch (err) {
    
    return null;
  }
}

export const getDB = getFirebaseAdminDB;
