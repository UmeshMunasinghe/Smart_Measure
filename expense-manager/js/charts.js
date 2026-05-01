// ============================================================
// charts.js
// Renders bar chart (daily spending) and pie chart (by category)
// using Chart.js for the history tab chart view.
// ============================================================

import { state, fmt, getCategoryById, calcCategoryTotals } from './state.js';

// Keep chart instances so we can destroy before re-rendering
let barChartInstance  = null;
let pieChartInstance  = null;

// Category colours palette
const PALETTE = [
  '#6C63FF', '#f59e0b', '#22c55e', '#ef4444', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
];

// ---- MAIN RENDER ----
export function renderCharts() {
  const data     = state.months[state.currentMonth] || { capital: 0, expenses: [] };
  const expenses = data.expenses;
  const empty    = document.getElementById('chartEmpty');

  if (expenses.length === 0) {
    empty.style.display = 'block';
    document.getElementById('barChart').closest('.chart-card').style.display = 'none';
    document.getElementById('pieChart').closest('.chart-card').style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  document.getElementById('barChart').closest('.chart-card').style.display = 'block';
  document.getElementById('pieChart').closest('.chart-card').style.display = 'block';

  renderBarChart(expenses);
  renderPieChart(expenses);
}

// ---- BAR CHART: daily spending ----
function renderBarChart(expenses) {
  // Build a map of { "YYYY-MM-DD": total }
  const dailyMap = {};
  expenses.forEach(e => {
    dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
  });

  // Sort dates ascending
  const sortedDates = Object.keys(dailyMap).sort();
  const labels = sortedDates.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const values = sortedDates.map(d => dailyMap[d]);

  // Destroy old chart if exists
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }

  const ctx = document.getElementById('barChart').getContext('2d');
  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spent',
        data: values,
        backgroundColor: 'rgba(108,99,255,0.7)',
        borderColor: '#6C63FF',
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => fmt(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 45 }
        },
        y: {
          grid: { color: '#f0f0f0' },
          ticks: {
            font: { size: 11 },
            callback: val => state.currency.trim() + ' ' + val.toLocaleString()
          }
        }
      }
    }
  });
}

// ---- PIE CHART: by category ----
function renderPieChart(expenses) {
  const catTotals  = calcCategoryTotals(expenses);
  const activeCats = state.categories.filter(c => catTotals[c.id]);

  const labels = activeCats.map(c => c.icon + ' ' + c.name);
  const values = activeCats.map(c => catTotals[c.id]);
  const colors = activeCats.map((_, i) => PALETTE[i % PALETTE.length]);

  // Destroy old chart if exists
  if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }

  const ctx = document.getElementById('pieChart').getContext('2d');
  pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '55%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 12 },
            padding: 12,
            usePointStyle: true,
            pointStyleWidth: 10,
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = Math.round((ctx.parsed / total) * 100);
              return ` ${fmt(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ---- DESTROY CHARTS (call when leaving history tab) ----
export function destroyCharts() {
  if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
  if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
}
