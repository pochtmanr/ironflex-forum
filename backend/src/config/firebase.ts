import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Initialize Firebase Admin SDK with the correct service account
const serviceAccount = require('/Users/romanpochtman/Developer/forum/ironflex-64531-firebase-adminsdk-fbsvc-bffdc63ee2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ironflex-64531'
});

export const auth = admin.auth();
export const db = admin.firestore();

// Verify Firebase ID token middleware
export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
};
