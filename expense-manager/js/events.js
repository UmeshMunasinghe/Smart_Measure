// ============================================================
// events.js
// All event listeners and user interaction handlers.
// Imports from db.js for data operations and render.js for UI.
// ============================================================

import { state, getMonthKey, ensureMonth, DEFAULT_CATEGORIES } from './state.js';
import { signInWithGoogle, signOutUser, renderUserAvatar, renderUserInfo } from './auth.js';
import {
  saveMonthCapital, addExpense, deleteExpense,
  saveSettings, clearAllData, loadMonth
} from './db.js';
import {
  showToast, openModal, closeModal,
  renderAll, renderHistory, renderCategoryGrid,
  renderSettingsTags, renderDashboard, renderFilterDropdown
} from './render.js';
import { renderCharts, destroyCharts } from './charts.js';

// Tracks which category is selected in the Add form
let selectedCategory = null;

// Tracks which expense is pending deletion
let pendingDeleteId  = null;

// Tracks current history view: 'list' or 'chart'
let historyView = 'list';

// ---- SETUP ALL LISTENERS ----
export function setupEventListeners() {
  setupLoginListeners();
  setupTabListeners();
  setupMonthNavListeners();
  setupCapitalListeners();
  setupAddExpenseListeners();
  setupHistoryListeners();
  setupChartToggleListeners();
  setupSettingsListeners();
  setupDeleteListeners();
  setupModalOverlayClose();
}

// ---- LOGIN ----
function setupLoginListeners() {
  document.getElementById('googleSignInBtn')
    .addEventListener('click', signInWithGoogle);
}

// ---- TABS ----
function setupTabListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'history') renderHistory();
    });
  });
}

// ---- MONTH NAVIGATION ----
function setupMonthNavListeners() {
  document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
}

async function navigateMonth(direction) {
  const [y, m] = state.currentMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + direction, 1);
  const newKey = getMonthKey(d);
  state.currentMonth = newKey;
  ensureMonth(newKey);

  if (!state.months[newKey] || state.months[newKey].expenses.length === 0) {
    await loadMonth(newKey);
  }

  renderAll(selectedCategory);

  // If chart view is active, refresh charts for new month
  if (historyView === 'chart') {
    setTimeout(() => renderCharts(), 50);
  }
}

// ---- CAPITAL ----
function setupCapitalListeners() {
  document.getElementById('editCapitalBtn').addEventListener('click', () => {
    const capital = (state.months[state.currentMonth] || {}).capital || 0;
    document.getElementById('capitalInput').value = capital || '';
    openModal('capitalModal');
  });

  document.getElementById('saveCapitalBtn').addEventListener('click', async () => {
    const val = parseFloat(document.getElementById('capitalInput').value);
    if (isNaN(val) || val < 0) { showToast('Please enter a valid amount'); return; }

    const btn = document.getElementById('saveCapitalBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Saving...';

    try {
      await saveMonthCapital(state.currentMonth, val);
      closeModal('capitalModal');
      renderDashboard();
      showToast('Capital updated ✓');
    } catch {
      showToast('Failed to save. Check your connection.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Save';
    }
  });

  document.getElementById('cancelCapitalBtn')
    .addEventListener('click', () => closeModal('capitalModal'));
}

// ---- ADD EXPENSE ----
function setupAddExpenseListeners() {
  // Category chip selection
  document.getElementById('categoryGrid').addEventListener('click', (e) => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    selectedCategory = chip.dataset.id;
    renderCategoryGrid(selectedCategory);
  });

  // Submit button
  document.getElementById('addExpenseBtn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('amountInput').value);
    const desc   = document.getElementById('descInput').value.trim();
    const date   = document.getElementById('dateInput').value;

    if (isNaN(amount) || amount <= 0) { showToast('Enter a valid amount'); return; }
    if (!selectedCategory)            { showToast('Please select a category'); return; }
    if (!date)                        { showToast('Please select a date'); return; }

    const expense = {
      amount,
      categoryId:  selectedCategory,
      description: desc,
      date,
      monthKey:    state.currentMonth,
    };

    const btn = document.getElementById('addExpenseBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Saving...';

    try {
      await addExpense(expense);

      // Reset form
      document.getElementById('amountInput').value = '';
      document.getElementById('descInput').value   = '';
      document.getElementById('dateInput').value   =
        new Date().toISOString().slice(0, 10);
      selectedCategory = null;
      renderCategoryGrid(null);

      // Switch to dashboard tab
      switchToTab('dashboard');
      renderAll(null);
      showToast('Expense added ✓');
    } catch {
      showToast('Failed to save. Check your connection.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Add Expense';
    }
  });
}

// ---- HISTORY SEARCH & FILTER ----
function setupHistoryListeners() {
  document.getElementById('searchInput')
    .addEventListener('input', refreshHistory);
  document.getElementById('filterCategory')
    .addEventListener('change', refreshHistory);
}

function refreshHistory() {
  const search = document.getElementById('searchInput').value;
  const filter = document.getElementById('filterCategory').value;
  renderHistory(search, filter);
}

// ---- CHART TOGGLE ----
function setupChartToggleListeners() {
  document.getElementById('viewListBtn').addEventListener('click', () => {
    historyView = 'list';
    document.getElementById('viewListBtn').classList.add('active');
    document.getElementById('viewChartBtn').classList.remove('active');
    document.getElementById('historyListView').style.display = 'block';
    document.getElementById('historyChartView').style.display = 'none';
    destroyCharts();
  });

  document.getElementById('viewChartBtn').addEventListener('click', () => {
    historyView = 'chart';
    document.getElementById('viewChartBtn').classList.add('active');
    document.getElementById('viewListBtn').classList.remove('active');
    document.getElementById('historyListView').style.display = 'none';
    document.getElementById('historyChartView').style.display = 'block';
    // Small delay so canvas is visible before Chart.js measures it
    setTimeout(() => renderCharts(), 50);
  });
}

// ---- SETTINGS ----
function setupSettingsListeners() {
  // Open settings modal
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('currencyInput').value = state.currency.trim();
    renderSettingsTags();
    renderUserInfo(state.user);
    openModal('settingsModal');
  });

  // Add custom category
  document.getElementById('addCategoryBtn').addEventListener('click', addCustomCategory);
  document.getElementById('newCategoryInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addCustomCategory();
  });

  // Remove custom category (fired from render.js via custom event)
  document.addEventListener('removeCategory', (e) => {
    state.categories = state.categories.filter(c => c.id !== e.detail.id);
    renderSettingsTags();
  });

  // Save settings
  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const currency = document.getElementById('currencyInput').value.trim() || 'LKR';
    const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
    const customCats = state.categories.filter(c => !defaultIds.includes(c.id));

    try {
      await saveSettings(currency + ' ', customCats);
      closeModal('settingsModal');
      renderAll(selectedCategory);
      showToast('Settings saved ✓');
    } catch {
      showToast('Failed to save settings.');
    }
  });

  // Sign out
  document.getElementById('signOutBtn').addEventListener('click', async () => {
    closeModal('settingsModal');
    await signOutUser();
  });

  // Clear all data
  document.getElementById('clearDataBtn').addEventListener('click', async () => {
    if (!confirm('Delete ALL your expense data permanently? This cannot be undone.')) return;
    try {
      await clearAllData();
      closeModal('settingsModal');
      renderAll(null);
      showToast('All data cleared');
    } catch {
      showToast('Failed to clear data.');
    }
  });
}

function addCustomCategory() {
  const input = document.getElementById('newCategoryInput');
  const name  = input.value.trim();
  if (!name) return;
  const id = 'custom_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  state.categories.push({ id, name, icon: '🏷️' });
  input.value = '';
  renderSettingsTags();
  showToast('Category added');
}

// ---- DELETE EXPENSE ----
function setupDeleteListeners() {
  // requestDelete is fired from render.js when trash icon is clicked
  document.addEventListener('requestDelete', (e) => {
    pendingDeleteId = e.detail.id;
    openModal('deleteModal');
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;

    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Deleting...';

    try {
      await deleteExpense(pendingDeleteId, state.currentMonth);
      pendingDeleteId = null;
      closeModal('deleteModal');
      renderAll(selectedCategory);
      showToast('Expense deleted');
    } catch {
      showToast('Failed to delete. Check your connection.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Delete';
    }
  });

  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    pendingDeleteId = null;
    closeModal('deleteModal');
  });
}

// ---- CLOSE MODALS ON OVERLAY CLICK ----
function setupModalOverlayClose() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        pendingDeleteId = null;
      }
    });
  });
}

// ---- UTILITY ----
function switchToTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}
