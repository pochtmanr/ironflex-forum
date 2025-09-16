import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAWEizoFEAMGVJMNAX4DVJiL-MwV1iYAIE",
  authDomain: "ironflex-64531.firebaseapp.com",
  projectId: "ironflex-64531",
  storageBucket: "ironflex-64531.firebasestorage.app",
  messagingSenderId: "68232161641",
  appId: "1:68232161641:web:1238c34934fc60f4a335f8",
  measurementId: "G-JMCBQHQJN5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;

