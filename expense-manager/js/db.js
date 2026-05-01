// ============================================================
// db.js
// All Firestore database read/write operations.
//
// Firestore data structure:
//   users/{uid}/
//     settings          (document)  ← currency, custom categories
//     months/{YYYY-MM}  (document)  ← capital for that month
//     expenses/{id}     (document)  ← individual expense entries
// ============================================================

import { db } from './firebase-config.js';
import {
  doc, collection, getDoc, getDocs, setDoc, addDoc,
  deleteDoc, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { state, DEFAULT_CATEGORIES } from './state.js';

// ---- HELPERS ----
const monthRef    = (key) => doc(db, 'users', state.user.uid, 'months', key);
const expCol      = ()    => collection(db, 'users', state.user.uid, 'expenses');
const settingsRef = ()    => doc(db, 'users', state.user.uid, 'settings', 'prefs');

// ---- SETTINGS ----

/** Load user settings (currency, custom categories) from Firestore */
export async function loadSettings() {
  try {
    const snap = await getDoc(settingsRef());
    if (snap.exists()) {
      const data = snap.data();
      if (data.currency) state.currency = data.currency;
      if (data.customCategories && data.customCategories.length > 0) {
        const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
        const custom = data.customCategories.filter(c => !defaultIds.includes(c.id));
        state.categories = [...DEFAULT_CATEGORIES, ...custom];
      }
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

/** Save user settings to Firestore */
export async function saveSettings(currency, customCategories) {
  try {
    await setDoc(settingsRef(), { currency, customCategories }, { merge: true });
    state.currency = currency;
    const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
    const custom = customCategories.filter(c => !defaultIds.includes(c.id));
    state.categories = [...DEFAULT_CATEGORIES, ...custom];
  } catch (err) {
    console.error('Failed to save settings:', err);
    throw err;
  }
}

// ---- CAPITAL ----

/** Load capital for a specific month from Firestore into local cache */
export async function loadMonthCapital(monthKey) {
  try {
    const snap = await getDoc(monthRef(monthKey));
    if (!state.months[monthKey]) state.months[monthKey] = { capital: 0, expenses: [] };
    if (snap.exists()) {
      state.months[monthKey].capital = snap.data().capital || 0;
    }
  } catch (err) {
    console.error('Failed to load capital:', err);
  }
}

/** Save capital for a specific month to Firestore */
export async function saveMonthCapital(monthKey, capital) {
  try {
    await setDoc(monthRef(monthKey), { capital, updatedAt: serverTimestamp() }, { merge: true });
    if (!state.months[monthKey]) state.months[monthKey] = { capital: 0, expenses: [] };
    state.months[monthKey].capital = capital;
  } catch (err) {
    console.error('Failed to save capital:', err);
    throw err;
  }
}

// ---- EXPENSES ----

/** Load all expenses for a specific month from Firestore into local cache */
export async function loadMonthExpenses(monthKey) {
  try {
    // Use only 'where' filter — no orderBy to avoid needing a composite index
    const q = query(expCol(), where('monthKey', '==', monthKey));
    const snap = await getDocs(q);
    if (!state.months[monthKey]) state.months[monthKey] = { capital: 0, expenses: [] };
    // Sort by date descending in JS instead of Firestore
    state.months[monthKey].expenses = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error('Failed to load expenses:', err);
  }
}

/** Add a new expense to Firestore and local cache */
export async function addExpense(expense) {
  try {
    const docRef = await addDoc(expCol(), {
      ...expense,
      createdAt: serverTimestamp()
    });
    const newExpense = { id: docRef.id, ...expense };
    if (!state.months[expense.monthKey]) {
      state.months[expense.monthKey] = { capital: 0, expenses: [] };
    }
    state.months[expense.monthKey].expenses.unshift(newExpense);
    return newExpense;
  } catch (err) {
    console.error('Failed to add expense:', err);
    throw err;
  }
}

/** Delete an expense from Firestore and local cache */
export async function deleteExpense(expenseId, monthKey) {
  try {
    await deleteDoc(doc(db, 'users', state.user.uid, 'expenses', expenseId));
    if (state.months[monthKey]) {
      state.months[monthKey].expenses =
        state.months[monthKey].expenses.filter(e => e.id !== expenseId);
    }
  } catch (err) {
    console.error('Failed to delete expense:', err);
    throw err;
  }
}

/** Delete ALL expenses and month data for this user */
export async function clearAllData() {
  try {
    // Delete all expenses
    const expSnap = await getDocs(expCol());
    const deletePromises = expSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // Delete all month documents
    const monthsCol = collection(db, 'users', state.user.uid, 'months');
    const monthSnap = await getDocs(monthsCol);
    const deleteMonths = monthSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deleteMonths);

    // Reset local cache
    state.months = {};
  } catch (err) {
    console.error('Failed to clear data:', err);
    throw err;
  }
}

/** Load both capital and expenses for a month in one call */
export async function loadMonth(monthKey) {
  await Promise.all([
    loadMonthCapital(monthKey),
    loadMonthExpenses(monthKey)
  ]);
}
