// ============================================================
// firebase-config.js
// Firebase initialization.
// IMPORTANT: Replace the placeholder values below with your
// own Firebase project config.
//
// How to get your config:
//   1. Go to https://console.firebase.google.com
//   2. Create a project (or open existing one)
//   3. Project Settings → Your apps → Add Web App
//   4. Copy the firebaseConfig object and paste values below
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore, enableIndexedDbPersistence }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- YOUR FIREBASE CONFIG ----
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);

// Enable offline support — app works without internet
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence unavailable: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Offline persistence not supported in this browser');
  }
});

export { auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
