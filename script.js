const categoryIcons = {
  'Food & Drinks': 'fa-utensils',
  'Data & Subscriptions': 'fa-wifi',
  'Transport': 'fa-bus',
  'Side Hustle': 'fa-briefcase',
  'Black Tax': 'fa-hand-holding-heart',
  'Health': 'fa-heartbeat',
  'Entertainment': 'fa-gamepad',
};

const categoryColors = {
  'Food & Drinks': '#f59e0b',
  'Data & Subscriptions': '#3b82f6',
  'Transport': '#10b981',
  'Side Hustle': '#8b5cf6',
  'Black Tax': '#ec4899',
  'Health': '#ef4444',
  'Entertainment': '#14b8a6',
};

const ADD_CUSTOM_VALUE = '__add_custom__';

const form = document.getElementById('expense-form');
const nameInput = document.getElementById('expense-name');
const amountInput = document.getElementById('expense-amount');
const categorySelect = document.getElementById('expense-category');
const expensesContainer = document.getElementById('expenses-container');
const totalAmount = document.getElementById('total-amount');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

const budgetToggle = document.getElementById('budget-toggle');
const budgetSection = document.getElementById('budget-section');
const budgetInputArea = document.getElementById('budget-input-area');
const budgetDisplayArea = document.getElementById('budget-display-area');
const budgetInput = document.getElementById('budget-input');
const budgetSetBtn = document.getElementById('budget-set-btn');
const budgetCancelBtn = document.getElementById('budget-cancel-btn');
const budgetEditBtn = document.getElementById('budget-edit-btn');
const budgetValueEl = document.getElementById('budget-value');
const budgetSpentValue = document.getElementById('budget-spent-value');
const budgetIndicator = document.getElementById('budget-indicator');
const budgetProgressFill = document.getElementById('budget-progress-fill');
const budgetToast = document.getElementById('budget-toast');

const pieChartWrapper = document.getElementById('pie-chart-wrapper');
const pieChart = document.getElementById('pie-chart');
const pieLegend = document.getElementById('pie-legend');

const categoryModal = document.getElementById('category-modal');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const customCatName = document.getElementById('custom-cat-name');
const colorPicker = document.getElementById('color-picker');
const errorCustomName = document.getElementById('error-custom-name');
const errorCustomColor = document.getElementById('error-custom-color');

let expenses = [];
let customCategory = null;
let budgetData = { on: false, amount: 0 };
let selectedColor = null;
let toastTimer = null;
let editingIndex = -1;

// ─── Theme ────────────────────────────────────────────────────────

function getPreferredTheme() {
  return localStorage.getItem('expense-wise-theme') || 'light';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  localStorage.setItem('expense-wise-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

themeToggle.addEventListener('click', toggleTheme);
setTheme(getPreferredTheme());

// ─── Custom Category ─────────────────────────────────────────────

function loadCustomCategory() {
  const stored = localStorage.getItem('expense-wise-custom-cat');
  if (!stored) return;
  try {
    customCategory = JSON.parse(stored);
    categoryIcons[customCategory.name] = 'fa-tag';
    categoryColors[customCategory.name] = customCategory.color;
  } catch { customCategory = null; }
}

function saveCustomCategory() {
  if (customCategory) {
    localStorage.setItem('expense-wise-custom-cat', JSON.stringify(customCategory));
  } else {
    localStorage.removeItem('expense-wise-custom-cat');
  }
}

function rebuildCategoryOptions() {
  const prev = categorySelect.value;
  categorySelect.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a category';
  categorySelect.appendChild(placeholder);

  const builtins = ['Food & Drinks', 'Data & Subscriptions', 'Transport', 'Side Hustle', 'Black Tax', 'Health', 'Entertainment'];
  builtins.forEach(n => {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = n;
    categorySelect.appendChild(o);
  });

  if (customCategory) {
    const o = document.createElement('option');
    o.value = customCategory.name;
    o.textContent = customCategory.name;
    categorySelect.appendChild(o);
  } else {
    const o = document.createElement('option');
    o.value = ADD_CUSTOM_VALUE;
    o.textContent = '+ Add Custom Category';
    categorySelect.appendChild(o);
  }

  const exists = [...categorySelect.options].some(o => o.value === prev);
  if (prev && exists) categorySelect.value = prev;
}

function populateSelect(el) {
  el.innerHTML = '';
  ['Food & Drinks', 'Data & Subscriptions', 'Transport', 'Side Hustle', 'Black Tax', 'Health', 'Entertainment'].forEach(n => {
    const o = document.createElement('option');
    o.value = n;
    o.textContent = n;
    el.appendChild(o);
  });
  if (customCategory) {
    const o = document.createElement('option');
    o.value = customCategory.name;
    o.textContent = customCategory.name;
    el.appendChild(o);
  }
}

function openCategoryModal() {
  categoryModal.classList.add('active');
  customCatName.value = '';
  selectedColor = null;
  errorCustomName.textContent = '';
  errorCustomColor.textContent = '';
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
  customCatName.focus();
}

function closeCategoryModal() {
  categoryModal.classList.remove('active');
}

function handleSaveCustom() {
  const name = customCatName.value.trim();
  if (!name) { errorCustomName.textContent = 'Please enter a category name.'; return; }
  if (!selectedColor) { errorCustomColor.textContent = 'Please pick a color.'; return; }
  errorCustomName.textContent = '';
  errorCustomColor.textContent = '';
  customCategory = { name, color: selectedColor };
  categoryIcons[name] = 'fa-tag';
  categoryColors[name] = selectedColor;
  saveCustomCategory();
  rebuildCategoryOptions();
  categorySelect.value = name;
  closeCategoryModal();
}

categorySelect.addEventListener('change', function () {
  if (this.value === ADD_CUSTOM_VALUE) {
    categoryModal.classList.add('active');
    customCatName.value = '';
    selectedColor = null;
    errorCustomName.textContent = '';
    errorCustomColor.textContent = '';
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    customCatName.focus();
    this.value = '';
  }
});

colorPicker.addEventListener('click', function (e) {
  const btn = e.target.closest('.color-btn');
  if (!btn) return;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedColor = btn.dataset.color;
  errorCustomColor.textContent = '';
});

modalClose.addEventListener('click', closeCategoryModal);
modalCancel.addEventListener('click', closeCategoryModal);
modalSave.addEventListener('click', handleSaveCustom);
categoryModal.addEventListener('click', function (e) { if (e.target === this) closeCategoryModal(); });
customCatName.addEventListener('input', function () { errorCustomName.textContent = ''; });
customCatName.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); handleSaveCustom(); }
});

// ─── Budget Mode ─────────────────────────────────────────────────

function loadBudgetData() {
  const stored = localStorage.getItem('expense-wise-budget');
  if (!stored) return;
  try { budgetData = JSON.parse(stored); } catch { budgetData = { on: false, amount: 0 }; }
}

function saveBudgetData() {
  localStorage.setItem('expense-wise-budget', JSON.stringify(budgetData));
}

function updateBudgetUI() {
  if (budgetData.on) {
    budgetSection.style.display = '';
    budgetToggle.style.color = 'var(--primary)';
    if (budgetData.amount > 0) {
      budgetInputArea.style.display = 'none';
      budgetCancelBtn.style.display = 'none';
      budgetDisplayArea.style.display = '';
      budgetValueEl.textContent = '₦' + Number(budgetData.amount).toLocaleString('en-US');
      budgetEditBtn.style.display = '';
    } else {
      budgetInputArea.style.display = '';
      budgetCancelBtn.style.display = 'none';
      budgetDisplayArea.style.display = 'none';
      budgetInput.value = '';
      budgetInput.focus();
    }
  } else {
    budgetSection.style.display = 'none';
    budgetToggle.style.color = '';
  }
  syncBudget();
  syncPieChart();
}

function toggleBudgetMode() {
  budgetData.on = !budgetData.on;
  saveBudgetData();
  updateBudgetUI();
}

function setBudget() {
  const val = budgetInput.value.trim();
  if (!val || Number(val) < 1) { budgetInput.focus(); return; }
  budgetData.amount = Number(val);
  saveBudgetData();
  budgetInputArea.style.display = 'none';
  budgetCancelBtn.style.display = 'none';
  budgetDisplayArea.style.display = '';
  budgetValueEl.textContent = '₦' + Number(budgetData.amount).toLocaleString('en-US');
  budgetEditBtn.style.display = '';
  syncBudget();
  syncPieChart();
}

function editBudget() {
  budgetInput.value = budgetData.amount;
  budgetDisplayArea.style.display = 'none';
  budgetInputArea.style.display = '';
  budgetCancelBtn.style.display = '';
  budgetInput.focus();
  budgetInput.select();
}

function cancelBudgetEdit() {
  if (budgetData.amount > 0) {
    budgetInputArea.style.display = 'none';
    budgetCancelBtn.style.display = 'none';
    budgetDisplayArea.style.display = '';
  } else {
    budgetInput.value = '';
    budgetCancelBtn.style.display = 'none';
  }
}

function syncBudget() {
  if (!budgetData.on || budgetData.amount <= 0) {
    budgetIndicator.className = 'budget-indicator';
    budgetProgressFill.style.width = '0%';
    budgetProgressFill.classList.remove('danger');
    return;
  }
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pct = Math.min((total / budgetData.amount) * 100, 100);
  budgetSpentValue.textContent = '₦' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  budgetProgressFill.style.width = pct + '%';
  budgetProgressFill.classList.toggle('danger', total > budgetData.amount);
  if (total > budgetData.amount) {
    budgetIndicator.className = 'budget-indicator exceeded';
    budgetIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    if (toastTimer) clearTimeout(toastTimer);
    budgetToast.classList.add('show');
    toastTimer = setTimeout(() => budgetToast.classList.remove('show'), 4000);
  } else {
    budgetIndicator.className = 'budget-indicator';
  }
}

budgetToggle.addEventListener('click', toggleBudgetMode);
budgetSetBtn.addEventListener('click', setBudget);
budgetCancelBtn.addEventListener('click', cancelBudgetEdit);
budgetEditBtn.addEventListener('click', editBudget);
budgetInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); setBudget(); }
});

// ─── Pie Chart ───────────────────────────────────────────────────

function syncPieChart() {
  const show = budgetData.on && budgetData.amount > 0 && expenses.length > 0;
  pieChartWrapper.style.display = show ? '' : 'none';
  if (!show) return;

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  if (total <= 0) { pieChartWrapper.style.display = 'none'; return; }

  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount); });

  const entries = Object.entries(byCat);
  let cum = 0;
  const segs = entries.map(([cat, amt]) => {
    const pct = (amt / total) * 100;
    const start = cum;
    cum += pct;
    return { cat, pct, color: categoryColors[cat] || '#64748b', start, end: cum };
  });

  pieChart.style.background = `conic-gradient(${segs.map(s => `${s.color} ${s.start.toFixed(2)}% ${s.end.toFixed(2)}%`).join(', ')})`;

  pieLegend.innerHTML = '';
  segs.forEach(s => {
    const row = document.createElement('div');
    row.className = 'pie-legend-item';
    row.innerHTML = `<span class="pie-legend-dot" style="background:${s.color}"></span><span class="pie-legend-label">${escapeHtml(s.cat)}</span><span class="pie-legend-pct">${s.pct.toFixed(1)}%</span>`;
    pieLegend.appendChild(row);
  });
}

// ─── Expense Data ────────────────────────────────────────────────

function loadExpenses() {
  const stored = localStorage.getItem('expense-wise');
  if (!stored) return;
  try { expenses = JSON.parse(stored); } catch { expenses = []; }
  render();
}

function saveExpenses() {
  localStorage.setItem('expense-wise', JSON.stringify(expenses));
}

function formatCurrency(amount) {
  return '₦' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function buildEmptyState() {
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.innerHTML = '<i class="fas fa-receipt"></i><p>No expenses yet.<br>Add one above!</p>';
  return el;
}

// ─── Render (one source of truth) ─────────────────────────────────

function render() {
  editingIndex = -1;

  const list = document.createDocumentFragment();

  if (expenses.length === 0) {
    list.appendChild(buildEmptyState());
  } else {
    expenses.forEach((exp, i) => {
      const row = document.createElement('div');
      row.className = 'expense-item';
      row.dataset.index = i;

      const color = categoryColors[exp.category] || '#64748b';
      const isCustom = customCategory && exp.category === customCategory.name;

      const icon = document.createElement('div');
      icon.className = 'expense-category-icon';
      icon.style.background = isCustom ? color : color + '22';
      icon.style.color = isCustom ? '#475569' : color;
      icon.innerHTML = `<i class="fas ${categoryIcons[exp.category] || 'fa-receipt'}"></i>`;

      const info = document.createElement('div');
      info.className = 'expense-info';
      info.innerHTML = `<div class="expense-name">${escapeHtml(exp.name)}</div><div class="expense-category">${escapeHtml(exp.category)}</div>`;

      const amt = document.createElement('div');
      amt.className = 'expense-amount';
      amt.textContent = formatCurrency(exp.amount);

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.dataset.index = i;
      editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
      editBtn.setAttribute('aria-label', 'Edit expense');

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.dataset.index = i;
      delBtn.innerHTML = '<i class="fas fa-trash"></i>';
      delBtn.setAttribute('aria-label', 'Delete expense');

      const btnGroup = document.createElement('div');
      btnGroup.style.cssText = 'display:flex;align-items:center;flex-shrink:0;';
      btnGroup.appendChild(editBtn);
      btnGroup.appendChild(delBtn);

      row.appendChild(icon);
      row.appendChild(info);
      row.appendChild(amt);
      row.appendChild(btnGroup);
      list.appendChild(row);
    });
  }

  expensesContainer.replaceChildren(list);

  updateTotal();
  syncBudget();
  syncPieChart();
}

function updateTotal() {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  totalAmount.textContent = formatCurrency(total);
}

// ─── Event Delegation (no stale closures) ────────────────────────

expensesContainer.addEventListener('click', function (e) {
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    const index = parseInt(editBtn.dataset.index, 10);
    const row = editBtn.closest('.expense-item');
    if (!isNaN(index) && row) enterEditMode(index, row);
    return;
  }

  const delBtn = e.target.closest('.delete-btn');
  if (delBtn) {
    const index = parseInt(delBtn.dataset.index, 10);
    if (!isNaN(index)) { if (editingIndex === index) editingIndex = -1; expenses.splice(index, 1); saveExpenses(); render(); }
    return;
  }

  const saveBtn = e.target.closest('.save-btn');
  if (saveBtn) {
    const index = parseInt(saveBtn.dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < expenses.length) commitEdit(index);
    return;
  }

  const cancelBtn = e.target.closest('.cancel-edit-btn');
  if (cancelBtn) {
    editingIndex = -1;
    render();
  }
});

// ─── Inline Editing ──────────────────────────────────────────────

function enterEditMode(index, row) {
  editingIndex = index;
  const exp = expenses[index];
  if (!exp) { editingIndex = -1; return; }

  const color = categoryColors[exp.category] || '#64748b';
  const isCustom = customCategory && exp.category === customCategory.name;

  const icon = document.createElement('div');
  icon.className = 'expense-category-icon';
  icon.style.background = isCustom ? color : color + '22';
  icon.style.color = isCustom ? '#475569' : color;
  icon.innerHTML = `<i class="fas ${categoryIcons[exp.category] || 'fa-receipt'}"></i>`;

  const fields = document.createElement('div');
  fields.className = 'expense-edit-fields';

  const nameF = document.createElement('input');
  nameF.type = 'text';
  nameF.className = 'expense-edit-name';
  nameF.value = exp.name;

  const rowEl = document.createElement('div');
  rowEl.className = 'expense-edit-row';

  const amtF = document.createElement('input');
  amtF.type = 'number';
  amtF.className = 'expense-edit-amount';
  amtF.value = exp.amount;
  amtF.min = '0';
  amtF.step = 'any';

  const catF = document.createElement('select');
  catF.className = 'expense-edit-category';
  populateSelect(catF);
  catF.value = exp.category;

  rowEl.appendChild(amtF);
  rowEl.appendChild(catF);
  fields.appendChild(nameF);
  fields.appendChild(rowEl);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.dataset.index = index;
  saveBtn.innerHTML = '<i class="fas fa-check"></i>';
  saveBtn.setAttribute('aria-label', 'Save');

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'delete-btn cancel-edit-btn';
  cancelBtn.style.marginLeft = '12px';
  cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
  cancelBtn.setAttribute('aria-label', 'Cancel');

  const act = document.createElement('div');
  act.style.cssText = 'display:flex;align-items:center;flex-shrink:0;';
  act.appendChild(saveBtn);
  act.appendChild(cancelBtn);

  row.className = 'expense-item editing';
  row.replaceChildren(icon, fields, act);

  nameF.focus();
  nameF.select();
}

function commitEdit(index) {
  const row = expensesContainer.querySelector(`.expense-item.editing`);
  if (!row) { editingIndex = -1; render(); return; }

  const nameF = row.querySelector('.expense-edit-name');
  const amtF = row.querySelector('.expense-edit-amount');
  const catF = row.querySelector('.expense-edit-category');

  const newName = nameF ? nameF.value.trim() : '';
  const newAmount = amtF ? amtF.value.trim() : '';
  const newCategory = catF ? catF.value : '';

  if (!newName || !newAmount || Number(newAmount) < 1 || !newCategory) return;

  expenses[index] = { name: newName, amount: newAmount, category: newCategory };
  editingIndex = -1;
  saveExpenses();
  render();
}

// ─── Form Submit ─────────────────────────────────────────────────

form.addEventListener('submit', function (e) {
  e.preventDefault();

  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

  const name = nameInput.value.trim();
  const amount = amountInput.value.trim();
  const category = categorySelect.value;

  let err = false;

  if (!name) { document.getElementById('error-name').textContent = 'Please, enter what you spent this money on'; err = true; }
  if (!amount || Number(amount) < 1) { document.getElementById('error-amount').textContent = 'Please, enter a valid amount in Naira.'; err = true; }
  if (!category) { document.getElementById('error-category').textContent = 'Please select a category to sort this expense.'; err = true; }

  if (err) return;

  expenses.push({ name, amount, category });
  editingIndex = -1;
  saveExpenses();
  render();

  nameInput.value = '';
  amountInput.value = '';
  categorySelect.value = '';
  nameInput.focus();
});

[nameInput, amountInput, categorySelect].forEach(el => {
  const ev = el === categorySelect ? 'change' : 'input';
  el.addEventListener(ev, function () {
    const map = { 'expense-name': 'error-name', 'expense-amount': 'error-amount', 'expense-category': 'error-category' };
    const id = map[el.id];
    if (id) document.getElementById(id).textContent = '';
  });
});

// ─── Init ────────────────────────────────────────────────────────

loadCustomCategory();
loadBudgetData();
rebuildCategoryOptions();
updateBudgetUI();
loadExpenses();
