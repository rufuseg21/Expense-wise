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

const form = document.getElementById('expense-form');
const nameInput = document.getElementById('expense-name');
const amountInput = document.getElementById('expense-amount');
const categorySelect = document.getElementById('expense-category');
const expensesContainer = document.getElementById('expenses-container');
const totalAmount = document.getElementById('total-amount');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

let expenses = [];

function getPreferredTheme() {
  const saved = localStorage.getItem('expense-wise-theme');
  if (saved) return saved;
  return 'light';
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

function loadExpenses() {
  const stored = localStorage.getItem('expense-wise');
  if (stored) {
    expenses = JSON.parse(stored);
    render();
  }
}

function saveExpenses() {
  localStorage.setItem('expense-wise', JSON.stringify(expenses));
}

function formatCurrency(amount) {
  return '₦' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function updateTotal() {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  totalAmount.textContent = formatCurrency(total);
}

function render() {
  expensesContainer.innerHTML = '';

  if (expenses.length === 0) {
    expensesContainer.appendChild(emptyState);
    updateTotal();
    return;
  }

  expenses.forEach((expense, index) => {
    const item = document.createElement('div');
    item.className = 'expense-item';

    const icon = document.createElement('div');
    icon.className = 'expense-category-icon';
    const color = categoryColors[expense.category] || '#64748b';
    icon.style.background = color + '22';
    icon.style.color = color;
    icon.innerHTML = `<i class="fas ${categoryIcons[expense.category] || 'fa-receipt'}"></i>`;

    const info = document.createElement('div');
    info.className = 'expense-info';
    info.innerHTML = `
      <div class="expense-name">${escapeHtml(expense.name)}</div>
      <div class="expense-category">${escapeHtml(expense.category)}</div>
    `;

    const amount = document.createElement('div');
    amount.className = 'expense-amount';
    amount.textContent = formatCurrency(expense.amount);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.setAttribute('aria-label', 'Delete expense');
    delBtn.addEventListener('click', () => removeExpense(index));

    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(amount);
    item.appendChild(delBtn);
    expensesContainer.appendChild(item);
  });

  updateTotal();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addExpense(name, amount, category) {
  expenses.push({ name, amount, category });
  saveExpenses();
  render();
}

function removeExpense(index) {
  expenses.splice(index, 1);
  saveExpenses();
  render();
}

function showError(inputId, message) {
  document.getElementById(inputId).textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();

  const name = nameInput.value.trim();
  const amount = amountInput.value.trim();
  const category = categorySelect.value;

  let hasError = false;

  if (!name) {
    showError('error-name', 'Please, enter what you spent this money on');
    hasError = true;
  }

  if (!amount || Number(amount) < 1) {
    showError('error-amount', 'Please, enter a valid amount in Naira.');
    hasError = true;
  }

  if (!category) {
    showError('error-category', 'Please select a category to sort this expense.');
    hasError = true;
  }

  if (hasError) return;

  addExpense(name, amount, category);

  form.reset();
  nameInput.focus();
});

[nameInput, amountInput, categorySelect].forEach(el => {
  const eventType = el === categorySelect ? 'change' : 'input';
  el.addEventListener(eventType, () => {
    const map = {
      'expense-name': 'error-name',
      'expense-amount': 'error-amount',
      'expense-category': 'error-category',
    };
    const errorId = map[el.id];
    if (errorId) document.getElementById(errorId).textContent = '';
  });
});

loadExpenses();
