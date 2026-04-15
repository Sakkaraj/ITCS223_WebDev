/**
 * api.js — Central API helper for BoonSonClon
 * All fetch calls go through apiFetch() so auth headers
 * and base URL are handled automatically in one place.
 */

const API_BASE = '';  // Empty = same origin (localhost:3000)

/**
 * Core fetch wrapper. Automatically attaches:
 *  - Content-Type: application/json
 *  - Authorization: Bearer <token> from localStorage (if present)
 *  - credentials: 'include' for session cookie
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('bsc_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `Request failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth Helpers ────────────────────────────────────────────

function saveSession(token, user) {
  localStorage.setItem('bsc_token', token);
  localStorage.setItem('bsc_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('bsc_token');
  localStorage.removeItem('bsc_user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('bsc_user'));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!localStorage.getItem('bsc_token');
}

function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

// ─── Cart Count Badge ────────────────────────────────────────

async function refreshCartCount() {
  try {
    const data = await apiFetch('/api/cart');
    const count = data.items ? data.items.length : 0;
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  } catch {
    // Silently fail — cart badge is not critical
  }
}

// ─── Toast Notification ──────────────────────────────────────

function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.bsc-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `bsc-toast bsc-toast--${type}`;
  toast.innerHTML = `
    <span class="bsc-toast__icon">${type === 'success' ? '✓' : '✕'}</span>
    <span class="bsc-toast__msg">${message}</span>
  `;

  // Inject minimal styles if not already present
  if (!document.getElementById('bsc-toast-style')) {
    const style = document.createElement('style');
    style.id = 'bsc-toast-style';
    style.textContent = `
      .bsc-toast {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        display: flex; align-items: center; gap: 10px;
        padding: 14px 20px; border-radius: 10px;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
        color: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        animation: bscSlideIn 0.3s ease, bscFadeOut 0.4s ease 2.6s forwards;
        max-width: 340px;
      }
      .bsc-toast--success { background: linear-gradient(135deg, #22c55e, #16a34a); }
      .bsc-toast--error   { background: linear-gradient(135deg, #ef4444, #dc2626); }
      .bsc-toast--info    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      .bsc-toast__icon { font-size: 18px; }
      @keyframes bscSlideIn  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes bscFadeOut  { from { opacity:1; } to { opacity:0; pointer-events:none; } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ─── Update Nav based on login state ────────────────────────

function updateNavAuth() {
  const user = getUser();
  const loginBtns = document.querySelectorAll('#loginBtn, .js-login-btn');
  const userMenus = document.querySelectorAll('.js-user-menu');
  const userNames = document.querySelectorAll('.js-user-name');

  if (user) {
    loginBtns.forEach(el => el.style.display = 'none');
    userMenus.forEach(el => el.style.display = 'flex');
    userNames.forEach(el => el.textContent = user.firstName || user.email);
  }
}

// Run on every page
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  refreshCartCount();
});

// Expose to other scripts
window.BSC = {
  apiFetch, saveSession, clearSession, getUser,
  isLoggedIn, isAdmin, showToast, refreshCartCount,
};
