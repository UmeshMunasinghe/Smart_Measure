// ===== EXPENSE TRACKER APP =====
// Pure JS, no dependencies, uses localStorage

// ---- DEFAULT CATEGORIES ----
const DEFAULT_CATEGORIES = [
  { id: 'groceries',   name: 'Groceries',   icon: '🛒' },
  { id: 'education',   name: 'Education',   icon: '📚' },
  { id: 'medicine',    name: 'Medicine',    icon: '💊' },
  { id: 'fresh_food',  name: 'Fresh Food',  icon: '🥦' },
  { id: 'fast_food',   name: 'Fast Food',   icon: '🍔' },
  { id: 'transport',   name: 'Transport',   icon: '🚌' },
  { id: 'utilities',   name: 'Utilities',   icon: '💡' },
  { id: 'clothing',    name: 'Clothing',    icon: '👕' },
  { id: 'entertainment', name: 'Fun',       icon: '🎮' },
  { id: 'other',       name: 'Other',       icon: '📦' },
];

// ---- STATE ----
let state = {
  currency: 'LKR ',
  categories: [...DEFAULT_CATEGORIES],
  months: {},       // { "2026-05": { capital: 0, expenses: [] } }
  currentMonth: '', // "YYYY-MM"
};

let pendingDeleteId = null;
let selectedCategory = null;

// ---- STORAGE ----
function saveState() {
  localStorage.setItem('expenseTrackerState', JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem('expenseTrackerState');
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      state = { ...state, ...saved };
      // Merge default categories with any custom ones
      const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
      const customCats = (saved.categories || []).filter(c => !defaultIds.includes(c.id));
      state.categories = [...DEFAULT_CATEGORIES, ...customCats];
    } catch(e) { /* ignore */ }
  }
}

// ---- MONTH HELPERS ----
function getMonthKey(date) {
  return date.toISOString().slice(0, 7); // "YYYY-MM"
}

function formatMonthLabel(key) {
  const [y, m] = key.split('-');
  const d = new Date(+y, +m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function ensureMonth(key) {
  if (!state.months[key]) {
    state.months[key] = { capital: 0, expenses: [] };
  }
}

function getCurrentMonthData() {
  ensureMonth(state.currentMonth);
  return state.months[state.currentMonth];
}

// ---- CALCULATIONS ----
function calcTotals(monthData) {
  const spent = monthData.expenses.reduce((s, e) => s + e.amount, 0);
  const balance = monthData.capital - spent;
  return { spent, balance };
}

function calcCategoryTotals(expenses) {
  const map = {};
  expenses.forEach(e => {
    map[e.categoryId] = (map[e.categoryId] || 0) + e.amount;
  });
  return map;
}

// ---- FORMAT ----
function fmt(amount) {
  return state.currency + amount.toFixed(2);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCategoryById(id) {
  return state.categories.find(c => c.id === id) || { name: id, icon: '📦' };
}

// ---- RENDER DASHBOARD ----
function renderDashboard() {
  const data = getCurrentMonthData();
  const { spent, balance } = calcTotals(data);
  const capital = data.capital;

  // Update currency symbols
  document.querySelectorAll('.input-prefix').forEach(el => el.textContent = state.currency);

  // Cards
  document.getElementById('capitalDisplay').textContent = fmt(capital);
  document.getElementById('spentDisplay').textContent = fmt(spent);
  document.getElementById('balanceDisplay').textContent = fmt(balance);

  const balanceCard = document.querySelector('.card-balance');
  balanceCard.classList.toggle('over-budget', balance < 0);

  // Progress
  const pct = capital > 0 ? Math.min((spent / capital) * 100, 100) : 0;
  const fill = document.getElementById('progressFill');
  fill.style.width = pct + '%';
  fill.className = 'progress-bar-fill' + (pct >= 100 ? ' over' : pct >= 80 ? ' warning' : '');
  document.getElementById('progressPercent').textContent =
    capital > 0 ? Math.round((spent / capital) * 100) + '%' : '0%';

  // Category breakdown
  const catTotals = calcCategoryTotals(data.expenses);
  const catContainer = document.getElementById('categoryBreakdown');
  const activeCats = state.categories.filter(c => catTotals[c.id]);

  if (activeCats.length === 0) {
    catContainer.innerHTML = '<div class="empty-state" style="padding:20px 0"><div class="empty-icon">📊</div><div>No expenses yet this month</div></div>';
  } else {
    const maxAmt = Math.max(...activeCats.map(c => catTotals[c.id]));
    catContainer.innerHTML = activeCats
      .sort((a, b) => catTotals[b.id] - catTotals[a.id])
      .map(cat => {
        const amt = catTotals[cat.id];
        const barPct = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;
        return `
          <div class="cat-row">
            <div class="cat-icon">${cat.icon}</div>
            <div class="cat-info">
              <div class="cat-name">${cat.name}</div>
              <div class="cat-bar-bg"><div class="cat-bar-fill" style="width:${barPct}%"></div></div>
            </div>
            <div class="cat-amount">${fmt(amt)}</div>
          </div>`;
      }).join('');
  }

  // Recent expenses (last 5)
  const recent = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const recentContainer = document.getElementById('recentExpenses');
  if (recent.length === 0) {
    recentContainer.innerHTML = '';
  } else {
    recentContainer.innerHTML = recent.map(e => renderExpenseItem(e)).join('');
    attachDeleteListeners(recentContainer);
  }
}

// ---- RENDER EXPENSE ITEM ----
function renderExpenseItem(expense) {
  const cat = getCategoryById(expense.categoryId);
  return `
    <div class="expense-item" data-id="${expense.id}">
      <div class="exp-icon">${cat.icon}</div>
      <div class="exp-info">
        <div class="exp-desc">${expense.description || cat.name}</div>
        <div class="exp-meta">${cat.name} · ${formatDate(expense.date)}</div>
      </div>
      <div class="exp-right">
        <div class="exp-amount">${fmt(expense.amount)}</div>
        <button class="exp-delete" data-id="${expense.id}" title="Delete">🗑️</button>
      </div>
    </div>`;
}

function attachDeleteListeners(container) {
  container.querySelectorAll('.exp-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pendingDeleteId = btn.dataset.id;
      openModal('deleteModal');
    });
  });
}

// ---- RENDER HISTORY ----
function renderHistory() {
  const data = getCurrentMonthData();
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filterCat = document.getElementById('filterCategory').value;

  // Update month label in history tab
  document.getElementById('historyMonthLabel').textContent =
    '📅 ' + formatMonthLabel(state.currentMonth);

  let expenses = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (search) {
    expenses = expenses.filter(e => {
      const cat = getCategoryById(e.categoryId);
      return (e.description || '').toLowerCase().includes(search) ||
             cat.name.toLowerCase().includes(search);
    });
  }
  if (filterCat) {
    expenses = expenses.filter(e => e.categoryId === filterCat);
  }

  const list = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');

  if (expenses.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    list.innerHTML = expenses.map(e => renderExpenseItem(e)).join('');
    attachDeleteListeners(list);
  }
}

// ---- RENDER CATEGORY GRID (Add tab) ----
function renderCategoryGrid() {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = state.categories.map(cat => `
    <div class="cat-chip ${selectedCategory === cat.id ? 'selected' : ''}" data-id="${cat.id}">
      <span class="cat-chip-icon">${cat.icon}</span>
      <span class="cat-chip-name">${cat.name}</span>
    </div>`).join('');

  grid.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedCategory = chip.dataset.id;
      renderCategoryGrid();
    });
  });
}

// ---- RENDER FILTER DROPDOWN ----
function renderFilterDropdown() {
  const sel = document.getElementById('filterCategory');
  const current = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' +
    state.categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  sel.value = current;
}

// ---- RENDER SETTINGS TAGS ----
function renderSettingsTags() {
  const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
  const custom = state.categories.filter(c => !defaultIds.includes(c.id));
  const list = document.getElementById('categoryTagList');
  list.innerHTML = custom.map(c => `
    <div class="tag">
      ${c.icon} ${c.name}
      <button class="tag-remove" data-id="${c.id}">✕</button>
    </div>`).join('');

  list.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.categories = state.categories.filter(c => c.id !== btn.dataset.id);
      renderSettingsTags();
    });
  });
}

// ---- FULL RENDER ----
function render() {
  document.getElementById('monthLabel').textContent = formatMonthLabel(state.currentMonth);
  renderDashboard();
  renderHistory();
  renderCategoryGrid();
  renderFilterDropdown();
}

// ---- MODAL HELPERS ----
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ---- TOAST ----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ---- INIT ----
function init() {
  loadState();

  // Set current month
  state.currentMonth = getMonthKey(new Date());
  ensureMonth(state.currentMonth);

  // Set today's date in add form
  document.getElementById('dateInput').value = new Date().toISOString().slice(0, 10);

  render();
  setupEventListeners();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ---- EVENT LISTENERS ----
function setupEventListeners() {

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'history') renderHistory();
    });
  });

  // Month navigation
  document.getElementById('prevMonth').addEventListener('click', () => {
    const [y, m] = state.currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    state.currentMonth = getMonthKey(d);
    ensureMonth(state.currentMonth);
    render();
  });

  document.getElementById('nextMonth').addEventListener('click', () => {
    const [y, m] = state.currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    state.currentMonth = getMonthKey(d);
    ensureMonth(state.currentMonth);
    render();
  });

  // Edit capital button
  document.getElementById('editCapitalBtn').addEventListener('click', () => {
    document.getElementById('capitalInput').value = getCurrentMonthData().capital || '';
    openModal('capitalModal');
  });

  // Save capital
  document.getElementById('saveCapitalBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('capitalInput').value);
    if (isNaN(val) || val < 0) { showToast('Please enter a valid amount'); return; }
    getCurrentMonthData().capital = val;
    saveState();
    closeModal('capitalModal');
    render();
    showToast('Capital updated ✓');
  });

  document.getElementById('cancelCapitalBtn').addEventListener('click', () => closeModal('capitalModal'));

  // Add expense
  document.getElementById('addExpenseBtn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('amountInput').value);
    const desc = document.getElementById('descInput').value.trim();
    const date = document.getElementById('dateInput').value;

    if (isNaN(amount) || amount <= 0) { showToast('Enter a valid amount'); return; }
    if (!selectedCategory) { showToast('Please select a category'); return; }
    if (!date) { showToast('Please select a date'); return; }

    const expense = {
      id: Date.now().toString(),
      amount,
      categoryId: selectedCategory,
      description: desc,
      date,
    };

    getCurrentMonthData().expenses.push(expense);
    saveState();

    // Reset form
    document.getElementById('amountInput').value = '';
    document.getElementById('descInput').value = '';
    document.getElementById('dateInput').value = new Date().toISOString().slice(0, 10);
    selectedCategory = null;
    renderCategoryGrid();

    // Switch to dashboard
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="dashboard"]').classList.add('active');
    document.getElementById('tab-dashboard').classList.add('active');

    render();
    showToast('Expense added ✓');
  });

  // History search/filter
  document.getElementById('searchInput').addEventListener('input', renderHistory);
  document.getElementById('filterCategory').addEventListener('change', renderHistory);

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('currencyInput').value = state.currency;
    renderSettingsTags();
    openModal('settingsModal');
  });

  // Add custom category
  document.getElementById('addCategoryBtn').addEventListener('click', addCustomCategory);
  document.getElementById('newCategoryInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') addCustomCategory();
  });

  function addCustomCategory() {
    const input = document.getElementById('newCategoryInput');
    const name = input.value.trim();
    if (!name) return;
    const id = 'custom_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    state.categories.push({ id, name, icon: '🏷️' });
    input.value = '';
    renderSettingsTags();
    showToast('Category added');
  }

  // Save settings
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const currency = document.getElementById('currencyInput').value.trim();
    if (currency) state.currency = currency;
    saveState();
    closeModal('settingsModal');
    render();
    showToast('Settings saved ✓');
  });

  // Clear all data
  document.getElementById('clearDataBtn').addEventListener('click', () => {
    if (confirm('Are you sure? This will delete ALL your expense data permanently.')) {
      localStorage.removeItem('expenseTrackerState');
      location.reload();
    }
  });

  // Delete modal
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (!pendingDeleteId) return;
    const data = getCurrentMonthData();
    data.expenses = data.expenses.filter(e => e.id !== pendingDeleteId);
    saveState();
    pendingDeleteId = null;
    closeModal('deleteModal');
    render();
    showToast('Expense deleted');
  });

  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    pendingDeleteId = null;
    closeModal('deleteModal');
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        pendingDeleteId = null;
      }
    });
  });

  // Capital modal — open on first visit if no capital set
  const data = getCurrentMonthData();
  if (data.capital === 0 && data.expenses.length === 0) {
    setTimeout(() => {
      document.getElementById('capitalInput').value = '';
      openModal('capitalModal');
    }, 400);
  }
}

// ---- START ----
document.addEventListener('DOMContentLoaded', init);
