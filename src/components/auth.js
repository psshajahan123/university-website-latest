// auth.js — Firebase Firestore version

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDMo8dcRmRyYzk39XAdPqxL3A2qS7ca-90",
  authDomain: "university-results-a10f6.firebaseapp.com",
  projectId: "university-results-a10f6",
  storageBucket: "university-results-a10f6.firebasestorage.app",
  messagingSenderId: "689968812493",
  appId: "1:689968812493:web:e3a559755c422ffbc37484",
  measurementId: "G-TESM0CK5WR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCol = collection(db, "users");

// ─── Auth State (session only — localStorage is fine here) ───────────────────

function getAuthState() {
  try { return JSON.parse(localStorage.getItem('authUser') || 'null'); }
  catch { return null; }
}

function setAuthState(user) {
  if (user) localStorage.setItem('authUser', JSON.stringify(user));
  else localStorage.removeItem('authUser');
}

// ─── Init ────────────────────────────────────────────────────────────────────

export function initAuth() {
  const loginBackdrop = document.getElementById('loginModal');
  const registerBackdrop = document.getElementById('registerModal');

  document.querySelectorAll('[data-open="login"]').forEach(el =>
    el.addEventListener('click', () => openLogin()));
  document.querySelectorAll('[data-open="register"]').forEach(el =>
    el.addEventListener('click', () => openRegister()));

  loginBackdrop?.addEventListener('click', e => { if (e.target === loginBackdrop) closeLogin(); });
  registerBackdrop?.addEventListener('click', e => { if (e.target === registerBackdrop) closeRegister(); });

  document.getElementById('loginClose')?.addEventListener('click', closeLogin);
  document.getElementById('registerClose')?.addEventListener('click', closeRegister);

  document.getElementById('switchToRegister')?.addEventListener('click', () => {
    closeLogin(); setTimeout(openRegister, 120);
  });
  document.getElementById('switchToLogin')?.addEventListener('click', () => {
    closeRegister(); setTimeout(openLogin, 120);
  });

  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLogin(); closeRegister(); }
  });

  updateAuthUI();
}

// ─── Login ───────────────────────────────────────────────────────────────────

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const alertEl = document.getElementById('loginAlert');

  clearAlerts('login');

  try {
    // Query Firestore for matching email + password
    const q = query(usersCol, where("email", "==", email), where("password", "==", btoa(password)));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showAlert(alertEl, 'error', '✗ Invalid email or password. Please try again.');
      return;
    }

    const user = snapshot.docs[0].data();
    setAuthState({ name: user.name, email: user.email });
    closeLogin();
    updateAuthUI();
    showToast('🎉 Welcome back, ' + user.name + '!', 'success');

  } catch (err) {
    console.error('Login error:', err);
    showAlert(alertEl, 'error', '✗ Something went wrong. Please try again.');
  }
}

// ─── Register ────────────────────────────────────────────────────────────────

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const alertEl = document.getElementById('registerAlert');

  clearAlerts('register');

  if (name.length < 2) {
    showAlert(alertEl, 'error', '✗ Please enter a valid full name.'); return;
  }
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    showAlert(alertEl, 'error', '✗ Please enter a valid email address.'); return;
  }
  if (password.length < 6) {
    showAlert(alertEl, 'error', '✗ Password must be at least 6 characters.'); return;
  }

  try {
    // Check if email already exists
    const q = query(usersCol, where("email", "==", email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      showAlert(alertEl, 'error', '✗ An account with this email already exists.'); return;
    }

    // Save new user to Firestore
    await addDoc(usersCol, {
      name,
      email,
      password: btoa(password),   // see security note below
      createdAt: new Date().toISOString()
    });

    setAuthState({ name, email });
    closeRegister();
    updateAuthUI();
    showToast('🎊 Account created! Welcome, ' + name + '!', 'success');

  } catch (err) {
    console.error('Register error:', err);
    showAlert(alertEl, 'error', '✗ Registration failed. Please try again.');
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

function logout() {
  setAuthState(null);
  updateAuthUI();
  showToast('👋 You have been signed out.', 'info');
}

// ─── UI Helpers (unchanged from your original) ───────────────────────────────

export function updateAuthUI() {
  const user = getAuthState();
  const headerActions = document.getElementById('headerActions');
  const sidebarAuthSection = document.getElementById('sidebarAuth');

  if (!headerActions) return;

  if (user) {
    headerActions.innerHTML = `
      <button class="theme-toggle" id="themeToggle" title="Toggle theme">☀️</button>
      <div class="user-menu-wrap">
        <div class="user-avatar" id="userAvatarBtn" title="${user.name}">${user.name.charAt(0).toUpperCase()}</div>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <strong>${user.name}</strong><span>${user.email}</span>
          </div>
          <a href="#">My Profile</a>
          <a href="#">Saved Results</a>
          <button class="logout-btn" id="logoutBtn">Sign Out</button>
        </div>
      </div>`;

    if (sidebarAuthSection) {
      sidebarAuthSection.innerHTML = `
        <div style="padding:12px 14px;font-size:.82rem;color:rgba(255,255,255,.5);border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:8px;">
          <strong style="color:#fff;">${user.name}</strong><br>${user.email}
        </div>
        <button class="sidebar-btn sidebar-btn-login" id="sidebarLogout">Sign Out</button>`;
      document.getElementById('sidebarLogout')?.addEventListener('click', logout);
    }

    document.getElementById('userAvatarBtn')?.addEventListener('click', () =>
      document.getElementById('userDropdown')?.classList.toggle('open'));
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.addEventListener('click', e => {
      if (!e.target.closest('.user-menu-wrap'))
        document.getElementById('userDropdown')?.classList.remove('open');
    });

  } else {
    headerActions.innerHTML = `
      <button class="theme-toggle" id="themeToggle" title="Toggle theme">☀️</button>
      <button class="btn btn-outline" data-open="login">Sign In</button>
      <button class="btn btn-primary" data-open="register">Register</button>`;

    if (sidebarAuthSection) {
      sidebarAuthSection.innerHTML = `
        <button class="sidebar-btn sidebar-btn-login" data-open="login">Sign In</button>
        <button class="sidebar-btn sidebar-btn-register" data-open="register">Register</button>`;
    }

    document.querySelectorAll('[data-open="login"]').forEach(el =>
      el.addEventListener('click', openLogin));
    document.querySelectorAll('[data-open="register"]').forEach(el =>
      el.addEventListener('click', openRegister));
  }

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.textContent = isDark ? '🌙' : '☀️';
    themeBtn.addEventListener('click', toggleTheme);
  }
}

function openLogin()    { document.getElementById('loginModal')?.classList.add('active');    clearAlerts('login'); }
function closeLogin()   { document.getElementById('loginModal')?.classList.remove('active'); }
function openRegister() { document.getElementById('registerModal')?.classList.add('active'); clearAlerts('register'); }
function closeRegister(){ document.getElementById('registerModal')?.classList.remove('active'); }

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