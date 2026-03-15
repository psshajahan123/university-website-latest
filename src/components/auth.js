// Auth Component: Login & Register Modals

export function initAuth() {
  const state = getAuthState();

  // DOM refs
  const loginBackdrop = document.getElementById('loginModal');
  const registerBackdrop = document.getElementById('registerModal');

  // Show modals
  document.querySelectorAll('[data-open="login"]').forEach(el =>
    el.addEventListener('click', () => openLogin()));
  document.querySelectorAll('[data-open="register"]').forEach(el =>
    el.addEventListener('click', () => openRegister()));

  // Close on backdrop click
  loginBackdrop?.addEventListener('click', e => {
    if (e.target === loginBackdrop) closeLogin();
  });
  registerBackdrop?.addEventListener('click', e => {
    if (e.target === registerBackdrop) closeRegister();
  });

  // Close buttons
  document.getElementById('loginClose')?.addEventListener('click', closeLogin);
  document.getElementById('registerClose')?.addEventListener('click', closeRegister);

  // Switch between modals
  document.getElementById('switchToRegister')?.addEventListener('click', () => {
    closeLogin(); setTimeout(openRegister, 120);
  });
  document.getElementById('switchToLogin')?.addEventListener('click', () => {
    closeRegister(); setTimeout(openLogin, 120);
  });

  // Login form
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  // Register form
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

  // Keyboard escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLogin(); closeRegister(); }
  });

  updateAuthUI();
}

function getAuthState() {
  try {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
  } catch { return null; }
}

function setAuthState(user) {
  if (user) {
    localStorage.setItem('authUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('authUser');
  }
}

export function updateAuthUI() {
  const user = getAuthState();
  const headerActions = document.getElementById('headerActions');
  const sidebarAuthSection = document.getElementById('sidebarAuth');

  if (!headerActions) return;

  if (user) {
    // Logged in state
    headerActions.innerHTML = `
      <button class="theme-toggle" id="themeToggle" title="Toggle theme">☀️</button>
      <div class="user-menu-wrap">
        <div class="user-avatar" id="userAvatarBtn" title="${user.name}">${user.name.charAt(0).toUpperCase()}</div>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <strong>${user.name}</strong>
            <span>${user.email}</span>
          </div>
          <a href="#">My Profile</a>
          <a href="#">Saved Results</a>
          <button class="logout-btn" id="logoutBtn">Sign Out</button>
        </div>
      </div>
    `;

    if (sidebarAuthSection) {
      sidebarAuthSection.innerHTML = `
        <div style="padding: 12px 14px; font-size:0.82rem; color:rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom:8px;">
          <strong style="color:#fff;">${user.name}</strong><br>${user.email}
        </div>
        <button class="sidebar-btn sidebar-btn-login" id="sidebarLogout">Sign Out</button>
      `;
      document.getElementById('sidebarLogout')?.addEventListener('click', logout);
    }

    document.getElementById('userAvatarBtn')?.addEventListener('click', () => {
      document.getElementById('userDropdown')?.classList.toggle('open');
    });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.addEventListener('click', e => {
      if (!e.target.closest('.user-menu-wrap')) {
        document.getElementById('userDropdown')?.classList.remove('open');
      }
    });

  } else {
    // Logged out
    headerActions.innerHTML = `
      <button class="theme-toggle" id="themeToggle" title="Toggle theme">☀️</button>
      <button class="btn btn-outline" data-open="login">Sign In</button>
      <button class="btn btn-primary" data-open="register">Register</button>
    `;
    if (sidebarAuthSection) {
      sidebarAuthSection.innerHTML = `
        <button class="sidebar-btn sidebar-btn-login" data-open="login">Sign In</button>
        <button class="sidebar-btn sidebar-btn-register" data-open="register">Register</button>
      `;
    }

    // Re-attach listeners after DOM update
    document.querySelectorAll('[data-open="login"]').forEach(el =>
      el.addEventListener('click', openLogin));
    document.querySelectorAll('[data-open="register"]').forEach(el =>
      el.addEventListener('click', openRegister));
  }

  // Re-init theme toggle
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = isDark ? '🌙' : '☀️';
    themeBtn.addEventListener('click', toggleTheme);
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const alertEl = document.getElementById('loginAlert');

  clearAlerts('login');

  // Load users from localStorage (simulated since we can't write to JSON at runtime)
  const users = getStoredUsers();
  const user = users.find(u => u.email === email && u.password === btoa(password));

  if (!user) {
    showAlert(alertEl, 'error', '✗ Invalid email or password. Please try again.');
    return;
  }

  setAuthState({ name: user.name, email: user.email });
  closeLogin();
  updateAuthUI();
  showToast('🎉 Welcome back, ' + user.name + '!', 'success');
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const alertEl = document.getElementById('registerAlert');

  clearAlerts('register');

  if (name.length < 2) {
    showAlert(alertEl, 'error', '✗ Please enter a valid full name.');
    return;
  }
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    showAlert(alertEl, 'error', '✗ Please enter a valid email address.');
    return;
  }
  if (password.length < 6) {
    showAlert(alertEl, 'error', '✗ Password must be at least 6 characters.');
    return;
  }

  const users = getStoredUsers();
  if (users.find(u => u.email === email)) {
    showAlert(alertEl, 'error', '✗ An account with this email already exists.');
    return;
  }

  users.push({ name, email, password: btoa(password), createdAt: new Date().toISOString() });
  saveStoredUsers(users);

  setAuthState({ name, email });
  closeRegister();
  updateAuthUI();
  showToast('🎊 Account created successfully! Welcome, ' + name + '!', 'success');
}

function logout() {
  setAuthState(null);
  updateAuthUI();
  showToast('👋 You have been signed out.', 'info');
}

function getStoredUsers() {
  try {
    return JSON.parse(localStorage.getItem('users_db') || '[]');
  } catch { return []; }
}

function saveStoredUsers(users) {
  localStorage.setItem('users_db', JSON.stringify(users));
}

function openLogin() {
  document.getElementById('loginModal')?.classList.add('active');
  clearAlerts('login');
}
function closeLogin() {
  document.getElementById('loginModal')?.classList.remove('active');
}
function openRegister() {
  document.getElementById('registerModal')?.classList.add('active');
  clearAlerts('register');
}
function closeRegister() {
  document.getElementById('registerModal')?.classList.remove('active');
}

function showAlert(el, type, msg) {
  if (!el) return;
  el.className = `modal-alert ${type} show`;
  el.innerHTML = msg;
}

function clearAlerts(form) {
  const id = form === 'login' ? 'loginAlert' : 'registerAlert';
  const el = document.getElementById(id);
  if (el) { el.className = 'modal-alert'; el.textContent = ''; }
}

export function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

export function showToast(msg, type = 'info') {
  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span>${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}
