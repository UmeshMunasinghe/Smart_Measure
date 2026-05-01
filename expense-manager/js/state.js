// ============================================================
// state.js
// Central app state and default category definitions.
// All other modules import from here.
// ============================================================

// ---- DEFAULT CATEGORIES ----
export const DEFAULT_CATEGORIES = [
  { id: 'groceries',     name: 'Groceries',     icon: '🛒' },
  { id: 'education',     name: 'Education',     icon: '📚' },
  { id: 'medicine',      name: 'Medicine',      icon: '💊' },
  { id: 'fresh_food',    name: 'Fresh Food',    icon: '🥦' },
  { id: 'fast_food',     name: 'Fast Food',     icon: '🍔' },
  { id: 'transport',     name: 'Transport',     icon: '🚌' },
  { id: 'utilities',     name: 'Utilities',     icon: '💡' },
  { id: 'clothing',      name: 'Clothing',      icon: '👕' },
  { id: 'entertainment', name: 'Fun',           icon: '🎮' },
  { id: 'other',         name: 'Other',         icon: '📦' },
];

// ---- APP STATE ----
// Single source of truth for the whole app.
export const state = {
  // Logged-in Firebase user object (null if not signed in)
  user: null,

  // Currency prefix shown before amounts
  currency: 'LKR ',

  // Full category list (defaults + any custom ones the user adds)
  categories: [...DEFAULT_CATEGORIES],

  // Currently viewed month, format "YYYY-MM"
  currentMonth: '',

  // Month data cache: { "YYYY-MM": { capital: 0, expenses: [] } }
  // Populated from Firestore as the user navigates months
  months: {},
};

// ---- HELPERS ----

/** Returns "YYYY-MM" for a given Date using local timezone */
export function getMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Returns "May 2026" style label from a "YYYY-MM" key */
export function formatMonthLabel(key) {
  const [y, m] = key.split('-');
  const d = new Date(+y, +m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Ensures a month entry exists in local cache */
export function ensureMonth(key) {
  if (!state.months[key]) {
    state.months[key] = { capital: 0, expenses: [] };
  }
}

/** Returns the data object for the currently viewed month */
export function getCurrentMonthData() {
  ensureMonth(state.currentMonth);
  return state.months[state.currentMonth];
}

/** Formats an amount with the currency prefix */
export function fmt(amount) {
  return state.currency + Number(amount).toFixed(2);
}

/** Formats a date string "YYYY-MM-DD" → "May 3" */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Finds a category object by its id */
export function getCategoryById(id) {
  return state.categories.find(c => c.id === id) || { name: id, icon: '📦' };
}

/** Calculates spent and remaining balance for a month */
export function calcTotals(monthData) {
  const spent = monthData.expenses.reduce((s, e) => s + e.amount, 0);
  const balance = monthData.capital - spent;
  return { spent, balance };
}

/** Returns a map of { categoryId: totalAmount } for a list of expenses */
export function calcCategoryTotals(expenses) {
  const map = {};
  expenses.forEach(e => {
    map[e.categoryId] = (map[e.categoryId] || 0) + e.amount;
  });
  return map;
}
