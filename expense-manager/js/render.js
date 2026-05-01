// ============================================================
// render.js
// All DOM rendering and UI update functions.
// No business logic here — only drawing to the screen.
// ============================================================

import {
  state, fmt, formatDate, formatMonthLabel,
  getCategoryById, calcTotals, calcCategoryTotals
} from './state.js';

// ---- LOADING OVERLAY ----

export function showLoading(text = 'Loading...') {
  const el = document.getElementById('loadingOverlay');
  const txt = el.querySelector('.loading-text');
  if (txt) txt.textContent = text;
  el.style.display = 'flex';
}

export function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// ---- LOGIN / APP SCREENS ----

export function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  hideLoading();
}

export function showAppScreen() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  hideLoading();
}

// ---- TOAST NOTIFICATION ----

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ---- MODAL HELPERS ----

export function openModal(id) {
  document.getElementById(id).classList.add('open');
}

export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ---- MONTH LABEL ----

export function renderMonthLabel() {
  document.getElementById('monthLabel').textContent =
    formatMonthLabel(state.currentMonth);
}

// ---- DASHBOARD ----

export function renderDashboard() {
  const data = state.months[state.currentMonth] || { capital: 0, expenses: [] };
  const { spent, balance } = calcTotals(data);
  const capital = data.capital;

  // Update currency prefix on all inputs
  document.querySelectorAll('.input-prefix').forEach(el => el.textContent = state.currency.trim());

  // Summary cards
  document.getElementById('capitalDisplay').textContent = fmt(capital);
  document.getElementById('spentDisplay').textContent   = fmt(spent);
  document.getElementById('balanceDisplay').textContent = fmt(balance);

  // Colour the balance card red if over budget
  document.querySelector('.card-balance')
    .classList.toggle('over-budget', balance < 0);

  // Progress bar
  const pct  = capital > 0 ? Math.min((spent / capital) * 100, 100) : 0;
  const fill = document.getElementById('progressFill');
  fill.style.width = pct + '%';
  fill.className   = 'progress-bar-fill' +
    (pct >= 100 ? ' over' : pct >= 80 ? ' warning' : '');
  document.getElementById('progressPercent').textContent =
    capital > 0 ? Math.round((spent / capital) * 100) + '%' : '0%';

  // Category breakdown
  renderCategoryBreakdown(data.expenses);

  // Recent expenses (latest 5)
  renderExpenseList(
    document.getElementById('recentExpenses'),
    [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  );
}

function renderCategoryBreakdown(expenses) {
  const catTotals  = calcCategoryTotals(expenses);
  const activeCats = state.categories.filter(c => catTotals[c.id]);
  const container  = document.getElementById('categoryBreakdown');

  if (activeCats.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:20px 0">
        <div class="empty-icon">📊</div>
        <div>No expenses yet this month</div>
      </div>`;
    return;
  }

  const maxAmt = Math.max(...activeCats.map(c => catTotals[c.id]));
  container.innerHTML = activeCats
    .sort((a, b) => catTotals[b.id] - catTotals[a.id])
    .map(cat => {
      const amt    = catTotals[cat.id];
      const barPct = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;
      return `
        <div class="cat-row">
          <div class="cat-icon">${cat.icon}</div>
          <div class="cat-info">
            <div class="cat-name">${cat.name}</div>
            <div class="cat-bar-bg">
              <div class="cat-bar-fill" style="width:${barPct}%"></div>
            </div>
          </div>
          <div class="cat-amount">${fmt(amt)}</div>
        </div>`;
    }).join('');
}

// ---- EXPENSE LIST (shared by dashboard & history) ----

export function renderExpenseList(container, expenses) {
  if (!expenses || expenses.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = expenses.map(e => expenseItemHTML(e)).join('');
  attachDeleteListeners(container);
}

function expenseItemHTML(expense) {
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

// Attach delete button listeners — fires a custom event so events.js handles it
function attachDeleteListeners(container) {
  container.querySelectorAll('.exp-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Dispatch a custom event that events.js listens for
      document.dispatchEvent(new CustomEvent('requestDelete', {
        detail: { id: btn.dataset.id }
      }));
    });
  });
}

// ---- HISTORY TAB ----

export function renderHistory(searchTerm = '', filterCatId = '') {
  const data = state.months[state.currentMonth] || { capital: 0, expenses: [] };

  // Month label banner
  document.getElementById('historyMonthLabel').textContent =
    '📅 ' + formatMonthLabel(state.currentMonth);

  let expenses = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    expenses = expenses.filter(e => {
      const cat = getCategoryById(e.categoryId);
      return (e.description || '').toLowerCase().includes(s) ||
             cat.name.toLowerCase().includes(s);
    });
  }

  if (filterCatId) {
    expenses = expenses.filter(e => e.categoryId === filterCatId);
  }

  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');

  if (expenses.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    renderExpenseList(list, expenses);
  }
}

// ---- CATEGORY GRID (Add Expense tab) ----

export function renderCategoryGrid(selectedId) {
  const grid = document.getElementById('categoryGrid');
  grid.innerHTML = state.categories.map(cat => `
    <div class="cat-chip ${selectedId === cat.id ? 'selected' : ''}" data-id="${cat.id}">
      <span class="cat-chip-icon">${cat.icon}</span>
      <span class="cat-chip-name">${cat.name}</span>
    </div>`).join('');
}

// ---- FILTER DROPDOWN (History tab) ----

export function renderFilterDropdown() {
  const sel     = document.getElementById('filterCategory');
  const current = sel.value;
  sel.innerHTML = '<option value="">All Categories</option>' +
    state.categories.map(c =>
      `<option value="${c.id}">${c.icon} ${c.name}</option>`
    ).join('');
  sel.value = current;
}

// ---- SETTINGS — CUSTOM CATEGORY TAGS ----

export function renderSettingsTags() {
  const defaultIds = ['groceries','education','medicine','fresh_food','fast_food',
                      'transport','utilities','clothing','entertainment','other'];
  const custom = state.categories.filter(c => !defaultIds.includes(c.id));
  const list   = document.getElementById('categoryTagList');

  list.innerHTML = custom.map(c => `
    <div class="tag">
      ${c.icon} ${c.name}
      <button class="tag-remove" data-id="${c.id}">✕</button>
    </div>`).join('');

  // Dispatch custom event so events.js can handle removal
  list.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('removeCategory', {
        detail: { id: btn.dataset.id }
      }));
    });
  });
}

// ---- FULL PAGE RENDER ----

export function renderAll(selectedCategoryId = null) {
  renderMonthLabel();
  renderDashboard();
  renderHistory();
  renderCategoryGrid(selectedCategoryId);
  renderFilterDropdown();
}
