import { initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBnyg-mGzSClWKv2IGsjwlUG4MOLny2iw0",
  authDomain: "mrgadhvii7.firebaseapp.com",
  projectId: "mrgadhvii7",
  storageBucket: "mrgadhvii7.firebasestorage.app",
  messagingSenderId: "774178050554",
  appId: "1:774178050554:web:90f73d60230ac4a59dd443",
  measurementId: "G-2NGH99TPP0"
};

// Initialize Firebase only once
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    // Get the existing app if it was already initialized
    app = getApp();
  } else {
    throw error;
  }
}

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable phone authentication persistence
auth.settings = {
  appVerificationDisabledForTesting: false // Set to true only in development
};

export default app;
