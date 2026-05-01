// ============================================================
// app.js
// Entry point. Ties everything together.
// Handles auth state changes and bootstraps the app.
// ============================================================

import { state, getMonthKey, ensureMonth } from './state.js';
import { listenAuthState, renderUserAvatar } from './auth.js';
import { loadSettings, loadMonth, saveMonthCapital } from './db.js';
import {
  showLoading, hideLoading, showLoginScreen, showAppScreen,
  openModal, renderAll, showToast
} from './render.js';
import { setupEventListeners } from './events.js';

// ---- BOOTSTRAP ----
document.addEventListener('DOMContentLoaded', () => {
  showLoading('Starting...');

  // Register service worker for offline/PWA support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Listen for Firebase auth state changes
  listenAuthState(onSignedIn, onSignedOut);

  // Wire up all UI event listeners (safe to do before sign-in)
  setupEventListeners();
});

// ---- SIGNED IN ----
async function onSignedIn(user) {
  showLoading('Loading your data...');

  try {
    // Set current month
    state.currentMonth = getMonthKey(new Date());
    ensureMonth(state.currentMonth);

    // Set today's date in the Add form
    document.getElementById('dateInput').value =
      new Date().toISOString().slice(0, 10);

    // Load settings and current month data from Firestore in parallel
    await Promise.all([
      loadSettings(),
      loadMonth(state.currentMonth)
    ]);

    // Show the app
    showAppScreen();
    renderUserAvatar(user);
    renderAll(null);

    // If this is a fresh month with no capital set, prompt the user
    const monthData = state.months[state.currentMonth];
    if (monthData.capital === 0 && monthData.expenses.length === 0) {
      setTimeout(() => {
        document.getElementById('capitalInput').value = '';
        openModal('capitalModal');
      }, 500);
    }

  } catch (err) {
    console.error('Failed to load app data:', err);
    showToast('Failed to load data. Check your connection.');
    hideLoading();
    showAppScreen();
  }
}

// ---- SIGNED OUT ----
function onSignedOut() {
  // Reset state
  state.user         = null;
  state.months       = {};
  state.currentMonth = '';

  showLoginScreen();
}
