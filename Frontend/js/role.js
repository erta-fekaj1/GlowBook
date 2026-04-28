/* ================================================================
   GLOWBOOK — role.js
   Role-based access control (RBAC) — frontend
   Roles: 'admin' | 'client'
   ================================================================ */

'use strict';

// ── Constants ─────────────────────────────────────────────────
const GB = {
    API:          'https://glowbook-1.onrender.com/api',
    KEY_TOKEN:    'glowbook_token',
    KEY_USER:     'glowbook_user',
    KEY_ROLE:     'glowbook_role',
    ADMIN_EMAILS: ['admin@glowbook.com', 'admin@gmail.com'],   // extend as needed
    ADMIN_NAME:   'admin',                                      // fallback: if name === 'admin'
};

// ── Storage helpers ────────────────────────────────────────────
function gbGetToken()  { return localStorage.getItem(GB.KEY_TOKEN); }
function gbGetUser()   { try { return JSON.parse(localStorage.getItem(GB.KEY_USER) || 'null'); } catch { return null; } }
function gbGetRole()   { return localStorage.getItem(GB.KEY_ROLE) || 'client'; }
function gbIsAdmin()   { return gbGetRole() === 'admin'; }
function gbIsClient()  { return gbGetRole() === 'client'; }
function gbIsLoggedIn(){ return !!gbGetToken(); }

// ── Role detection ─────────────────────────────────────────────
function detectRole(user) {
    if (!user) return 'client';
    // 1. Backend already sent role = 'Admin'
    if (user.role && user.role.toLowerCase() === 'admin') return 'admin';
    // 2. Email whitelist
    if (user.email && GB.ADMIN_EMAILS.includes(user.email.toLowerCase())) return 'admin';
    // 3. Name fallback
    if (user.name && user.name.toLowerCase() === GB.ADMIN_NAME) return 'admin';
    return 'client';
}

function saveSession(token, user) {
    const role = detectRole(user);
    localStorage.setItem(GB.KEY_TOKEN,  token);
    localStorage.setItem(GB.KEY_USER,   JSON.stringify(user));
    localStorage.setItem(GB.KEY_ROLE,   role);
    return role;
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
    [GB.KEY_TOKEN, GB.KEY_USER, GB.KEY_ROLE].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.replace('index.html');
}

// ── Auth guard — call at top of protected pages ────────────────
function requireAuth() {
    if (!gbIsLoggedIn()) {
        window.location.replace('index.html');
        return false;
    }
    return true;
}

// ── Admin guard — call at top of admin-only pages ─────────────
function requireAdmin() {
    if (!gbIsLoggedIn()) { window.location.replace('index.html'); return false; }
    if (!gbIsAdmin())    { window.location.replace('dashboard.html'); return false; }
    return true;
}

// ── authFetch with automatic 401 handling ─────────────────────
async function authFetch(url, options = {}) {
    const token = gbGetToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) { logout(); return null; }
        return res;
    } catch(e) { console.error('authFetch error:', e); return null; }
}

// ── UI: apply role class to <body> ────────────────────────────
// Adds  class="role-admin" or "role-client" to body.
// CSS can then hide/show elements with [data-admin] [data-client].
function applyRoleToBody() {
    const role = gbGetRole();
    document.body.classList.remove('role-admin', 'role-client');
    document.body.classList.add('role-' + role);
}

// ── UI: load user badge (topbar) ──────────────────────────────
function loadUserBadge() {
    const user = gbGetUser();
    if (!user) return;
    const nameEl     = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');
    const roleTagEl  = document.getElementById('userRoleTag');
    if (nameEl) nameEl.textContent = user.name || 'Përdorues';
    if (initialsEl) {
        initialsEl.textContent = (user.name || 'U')
            .split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (roleTagEl) {
        roleTagEl.textContent  = gbIsAdmin() ? 'Admin' : 'Klient';
        roleTagEl.className    = 'role-tag ' + (gbIsAdmin() ? 'role-tag-admin' : 'role-tag-client');
    }
}

// ── UI: build sidebar with role-aware links ───────────────────
function buildSidebar(activePage) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const adminLinks = gbIsAdmin() ? `
        <a class="nav-item ${activePage==='admin'?'active':''}" href="admin.html">
            <i class="fa-solid fa-shield-halved nav-icon"></i> Admin Panel
        </a>
        <a class="nav-item ${activePage==='users'?'active':''}" href="users.html">
            <i class="fa-solid fa-users nav-icon"></i> Përdoruesit
        </a>` : '';

    const sharedLinks = `
        <a class="nav-item ${activePage==='dashboard'?'active':''}" href="dashboard.html">
            <i class="fa-solid fa-house nav-icon"></i> Dashboard
        </a>
        <a class="nav-item ${activePage==='appointments'?'active':''}" href="appointments.html">
            <i class="fa-regular fa-calendar-check nav-icon"></i> Takimet
        </a>
        <a class="nav-item ${activePage==='services'?'active':''}" href="services.html">
            <i class="fa-solid fa-spa nav-icon"></i> Shërbimet
        </a>
        <a class="nav-item ${activePage==='gallery'?'active':''}" href="gallery.html">
            <i class="fa-regular fa-images nav-icon"></i> Galeria
        </a>
        <a class="nav-item ${activePage==='payment'?'active':''}" href="payment.html">
            <i class="fa-solid fa-credit-card nav-icon"></i> Pagesa
        </a>`;

    sidebar.innerHTML = `
        <div class="logo">
            <span class="logo-icon">💅</span>
            <h2>Glow Book</h2>
            <p>Nail Salon</p>
        </div>
        ${adminLinks}
        ${sharedLinks}
        <div class="nav-bottom">
            <a class="nav-item nav-logout" onclick="logout()">
                <i class="fa-solid fa-right-from-bracket nav-icon"></i> Dilni
            </a>
        </div>`;
}

// ── UI: init mobile sidebar toggle ───────────────────────────
function initSidebar() {
    const btn     = document.getElementById('hamburgerBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (btn) btn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    });
    if (overlay) overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    });
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.className = 'gb-toast ' + type;
    clearTimeout(t._t); t._t = setTimeout(() => t.className = 'gb-toast', 3500);
}

// ── Page init helper — call once per page ─────────────────────
// usage: gbInitPage({ page: 'gallery', adminOnly: false });
function gbInitPage({ page = '', adminOnly = false } = {}) {
    if (adminOnly) { if (!requireAdmin()) return false; }
    else           { if (!requireAuth())  return false; }
    applyRoleToBody();
    buildSidebar(page);
    initSidebar();
    loadUserBadge();
    return true;
}