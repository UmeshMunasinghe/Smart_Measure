// ============================================================
// auth.js
// Handles Google Sign-In, Sign-Out, and auth state changes.
// ============================================================

import {
  auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from './firebase-config.js';

import { state } from './state.js';
import { showToast, showLoading, hideLoading } from './render.js';

// ---- SIGN IN WITH GOOGLE ----
export async function signInWithGoogle() {
  try {
    showLoading('Signing in...');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // onAuthStateChanged in app.js handles the rest
  } catch (err) {
    hideLoading();
    if (err.code !== 'auth/popup-closed-by-user') {
      showToast('Sign-in failed. Please try again.');
      console.error('Sign-in error:', err);
    }
  }
}

// ---- SIGN OUT ----
export async function signOutUser() {
  try {
    await signOut(auth);
    // onAuthStateChanged in app.js handles UI reset
  } catch (err) {
    showToast('Sign-out failed.');
    console.error('Sign-out error:', err);
  }
}

// ---- LISTEN FOR AUTH STATE CHANGES ----
// Calls onSignedIn(user) or onSignedOut() as the auth state changes.
export function listenAuthState(onSignedIn, onSignedOut) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      state.user = user;
      onSignedIn(user);
    } else {
      state.user = null;
      onSignedOut();
    }
  });
}

// ---- UPDATE USER AVATAR IN HEADER ----
export function renderUserAvatar(user) {
  const avatar = document.getElementById('userAvatar');
  if (!avatar) return;
  if (user.photoURL) {
    avatar.style.backgroundImage = `url(${user.photoURL})`;
    avatar.style.backgroundSize = 'cover';
    avatar.textContent = '';
  } else {
    avatar.textContent = user.displayName ? user.displayName[0].toUpperCase() : '?';
  }
}

// ---- UPDATE USER INFO IN SETTINGS MODAL ----
export function renderUserInfo(user) {
  const box = document.getElementById('userInfoBox');
  if (!box || !user) return;
  box.innerHTML = `
    <div class="user-info-inner">
      <div class="user-info-name">${user.displayName || 'User'}</div>
      <div class="user-info-email">${user.email}</div>
    </div>`;
}
