/**
 * api.js — Central API helper for BoonSonClon
 * All fetch calls go through apiFetch() so auth headers
 * and base URL are handled automatically in one place.
 */

// Configure API base URL
// For local development with separate servers:
// - Backend: http://localhost:3000
// - Frontend: http://localhost:5000 (or other port)
// Set this to the backend server URL
// ── API Configuration ──
// Auto-detect environment: 
// 1. If hostname is localhost/127.0.0.1 or a local network IP (192.168.x.x, 10.x.x.x), use explicit port 3000.
// 2. Otherwise (Production/Render), use relative paths (unified mode).
const getApiBase = () => {
  if (localStorage.getItem('api_base')) return localStorage.getItem('api_base');
  
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || 
                  host === '127.0.0.1' || 
                  host.startsWith('192.168.') || 
                  host.startsWith('10.') || 
                  host.startsWith('172.');
                  
  return isLocal ? 'http://' + host + ':3000' : '';
};

const API_BASE = getApiBase();

/**
 * Helper to detect if the current page is an admin-context page
 */
function detectRoleContext() {
  const currentFile = window.location.pathname.split("/").pop() || "home";
  const urlParams = new URLSearchParams(window.location.search);
  const adminPages = ["admin-panel", "add-product", "admin-products", "admin-login", "admin-signup"];
  
  let isAd = adminPages.some(p => currentFile.includes(p));
  // Special case: order-details is admin only if 'from' is NOT 'user'
  if (currentFile.includes('order-details')) {
    isAd = urlParams.get('from') !== 'user';
  }
  return isAd ? 'admin' : 'member';
}

/**
 * Core fetch wrapper. Automatically attaches:
 *  - Content-Type: application/json
 *  - Authorization: Bearer <token>
 *  - credentials: 'include' for session cookie
 */
async function apiFetch(endpoint, options = {}) {
  // Select the correct token based on context (Admin pages vs Store pages)
  const role = detectRoleContext();
  const tokenKey = role === 'admin' ? 'bsc_admin_token' : 'bsc_member_token';
  const token = localStorage.getItem(tokenKey);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  console.log(`API Call [${tokenKey}]: ${API_BASE}${endpoint}`, { headers, options });

  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  // Try to parse JSON
  let data;
  let responseText = '';
  try {
    responseText = await response.text();
    data = JSON.parse(responseText);
  } catch (parseErr) {
    console.warn('JSON Parse Warning:', parseErr);
    data = { error: 'Invalid JSON response' };
  }

  if (!response.ok) {
    const error = new Error(data.error || `Request failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Auth Helpers ────────────────────────────────────────────

function saveSession(role, token, user) {
  const prefix = role === 'admin' ? 'bsc_admin_' : 'bsc_member_';
  localStorage.setItem(prefix + 'token', token);
  localStorage.setItem(prefix + 'user', JSON.stringify(user));
}

function clearSession(role) {
  if (!role) {
    role = detectRoleContext();
  }
  const prefix = role === 'admin' ? 'bsc_admin_' : 'bsc_member_';
  localStorage.removeItem(prefix + 'token');
  localStorage.removeItem(prefix + 'user');
}

function getUser(role) {
  // If role is not provided, detect based on current page
  if (!role) {
    role = detectRoleContext();
  }

  const prefix = role === 'admin' ? 'bsc_admin_' : 'bsc_member_';
  try {
    return JSON.parse(localStorage.getItem(prefix + 'user'));
  } catch {
    return null;
  }
}


function isLoggedIn(role) {
  if (!role) {
    return !!localStorage.getItem('bsc_member_token') || !!localStorage.getItem('bsc_admin_token');
  }
  const prefix = role === 'admin' ? 'bsc_admin_' : 'bsc_member_';
  return !!localStorage.getItem(prefix + 'token');
}

function isAdmin() {
  return isLoggedIn('admin');
}

// ─── Cart Count Badge ────────────────────────────────────────

async function refreshCartCount() {
  try {
    const data = await apiFetch('/api/cart');
    // Sum up the quantities of all items
    const count = data.items ? data.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) : 0;
    
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(el => {
      el.textContent = count;
      // Show if > 0, hide if 0
      if (count > 0) {
        el.style.display = 'flex';
        el.classList.remove('is-hidden');
      } else {
        el.style.display = 'none';
        el.classList.add('is-hidden');
      }
    });
  } catch (err) {
    console.warn('Failed to refresh cart count:', err);
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
        padding: 14px 20px; border-radius: 0;
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
  const member = getUser('member');
  const admin = getUser('admin');
  
  // ─── 1. Member UI (Storefront Header) ───
  const loginBtns = document.querySelectorAll('.js-login-btn');
  const userMenus = document.querySelectorAll('.js-user-menu');
  const userNames = document.querySelectorAll('.js-user-name');

  if (member) {
    loginBtns.forEach(el => el.style.display = 'none');
    userMenus.forEach(el => el.style.display = 'flex');
    userNames.forEach(el => el.textContent = member.firstName || member.email);
  } else {
    loginBtns.forEach(el => el.style.display = 'flex');
    userMenus.forEach(el => el.style.display = 'none');
  }

  // ─── 2. Admin Awareness on Storefront ───
  const adminAccess = document.querySelectorAll('.js-admin-access');
  adminAccess.forEach(el => {
    // ALWAYS show the admin access link on the storefront
    el.style.display = 'flex';
    const span = el.querySelector('span');
    if (span) {
      span.textContent = admin ? 'Admin Dashboard' : 'Admin Panel';
    }
  });

  // ─── 3. Admin identity on Admin Header ───
  const adminNameEl = document.querySelector('.js-admin-name');
  if (adminNameEl && admin) {
    adminNameEl.textContent = admin.firstName || admin.email;
  }
}

// Run on every page
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  refreshCartCount();

  // Global logout handler
  document.addEventListener('click', (e) => {
    if (e.target.closest('.js-logout-btn')) {
      const role = detectRoleContext();
      clearSession(role);
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = (role === 'admin') ? '/pages/admin-login' : '/pages/home';
      }, 800);
    }
  });
});

// Expose to other scripts
window.BSC = {
  apiFetch, saveSession, clearSession, getUser,
  isLoggedIn, isAdmin, showToast, refreshCartCount,
  updateNavAuth,
};
