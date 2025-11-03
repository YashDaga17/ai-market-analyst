// NOTE: Firebase Admin SDK is not installed.
// To use this file, install: pnpm add firebase-admin
// For now, this file is disabled - you're using client-side Firebase instead.

// import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (DISABLED - package not installed)
// if (!admin.apps.length) {
//   const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
//   
//   if (serviceAccount) {
//     admin.initializeApp({
//       credential: admin.credential.cert(JSON.parse(serviceAccount)),
//       projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-market-analysis-a3aad',
//     });
//   } else {
//     admin.initializeApp({
//       credential: admin.credential.applicationDefault(),
//       projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-market-analysis-a3aad',
//     });
//   }
// }

// Placeholder exports to prevent import errors
export const adminDb = null as any;
export const adminAuth = null as any;
