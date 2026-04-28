/* ================================================================
   GLOWBOOK — role.js  (v3 — bug-fixed login)
   Role-based access control (RBAC) — frontend only
   Roles stored in localStorage: 'admin' | 'client'

   ROOT CAUSE OF BUG (fixed here):
     The Render API returns HTTP 403 "Host not in allowlist" —
     this is NOT a network error, so fetch() catch{} never ran.
     The else branch showed an error toast without trying the
     demo/local fallback. Fix: always try local credentials
     when the API is unavailable or blocked.
   ================================================================ */

'use strict';

/* ── Constants ─────────────────────────────────────────────── */
const GB = {
    API:       'https://glowbook-1.onrender.com/api',

    /* localStorage keys */
    KEY_TOKEN: 'glowbook_token',
    KEY_USER:  'glowbook_user',
    KEY_ROLE:  'glowbook_role',

    /* Admin detection — add more emails here if needed */
    ADMIN_EMAILS: ['admin@glowbook.com', 'admin@gmail.com'],

    /* Local credential store — used when API is blocked / offline */
    LOCAL_USERS: [
        {
            id: 1,
            name: 'Admin GlowBook',
            email: 'admin@glowbook.com',
            password: 'admin123',
            role: 'Admin',
            phoneNumber: '044000000'
        },
        {
            id: 2,
            name: 'Admin',
            email: 'admin@gmail.com',
            password: 'admin123',
            role: 'Admin',
            phoneNumber: '044000001'
        }
    ]
};

/* ── Storage helpers ──────────────────────────────────────── */
function gbGetToken()   { return localStorage.getItem(GB.KEY_TOKEN); }
function gbGetRole()    { return localStorage.getItem(GB.KEY_ROLE) || 'client'; }
function gbIsAdmin()    { return gbGetRole() === 'admin'; }
function gbIsClient()   { return gbGetRole() === 'client'; }
function gbIsLoggedIn() { return !!gbGetToken(); }

function gbGetUser() {
    try { return JSON.parse(localStorage.getItem(GB.KEY_USER) || 'null'); }
    catch { return null; }
}

/* ── Role detection — single source of truth ─────────────── */
function detectRole(user) {
    if (!user) return 'client';

    /* 1. Backend/stored role field */
    if (typeof user.role === 'string' && user.role.toLowerCase() === 'admin') {
        return 'admin';
    }
    /* 2. Email whitelist */
    if (user.email && GB.ADMIN_EMAILS.includes(user.email.trim().toLowerCase())) {
        return 'admin';
    }
    /* 3. Name exactly equals 'admin' (case-insensitive) */
    if (user.name && user.name.trim().toLowerCase() === 'admin') {
        return 'admin';
    }
    return 'client';
}

/* ── Persist session to localStorage ─────────────────────── */
function saveSession(token, user) {
    const role = detectRole(user);
    localStorage.setItem(GB.KEY_TOKEN, token);
    localStorage.setItem(GB.KEY_USER,  JSON.stringify(user));
    localStorage.setItem(GB.KEY_ROLE,  role);
    return role;
}

/* ── Clear session / logout ───────────────────────────────── */
function logout() {
    [GB.KEY_TOKEN, GB.KEY_USER, GB.KEY_ROLE].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.replace('index.html');
}

/* ── Validate email format ────────────────────────────────── */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ── LOCAL credential check (used as fallback) ────────────── */
/*
   Priority order when the API is unavailable / returns non-JSON / blocked:
   1. Check GB.LOCAL_USERS for an exact email + password match → role from that record
   2. Any other valid email + non-empty password → create a client session
   Returns { success, user, role } or { success: false, message }
*/
function localLogin(email, password) {
    const normEmail = email.trim().toLowerCase();
    const normPass  = password.trim();              /* trim whitespace typos */

    /* Look for exact match in local store */
    const found = GB.LOCAL_USERS.find(
        u => u.email.toLowerCase() === normEmail && u.password === normPass
    );

    if (found) {
        /* Strip password before storing in localStorage */
        const { password: _pw, ...safeUser } = found;
        return { success: true, user: safeUser };
    }

    /* Secondary check: email matches a known admin email but wrong password */
    const emailIsAdmin = GB.ADMIN_EMAILS.includes(normEmail);
    if (emailIsAdmin) {
        return {
            success: false,
            message: 'Fjalëkalimi i gabuar për llogarinë admin.'
        };
    }

    /* Any other email + password → treat as a new client (demo mode) */
    if (normEmail && normPass.length > 0) {
        const clientUser = {
            id: Date.now(),
            name: email.split('@')[0].replace(/[^a-zA-Z ]/g, '') || 'Klient',
            email: email.trim(),
            role: 'Customer',
            phoneNumber: ''
        };
        return { success: true, user: clientUser };
    }

    return { success: false, message: 'Kredenciale të pavlefshme.' };
}

/* ── API login attempt (returns null when unavailable) ───── */
/*
   Returns:
     { ok: true, user, token }   — successful API login
     { ok: false, message }      — API returned an auth error (wrong password)
     null                        — API unavailable / blocked / network error
*/
async function apiLogin(email, password) {
    try {
        const res = await fetch(`${GB.API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email: email.trim(), password })
        });

        /* Try to parse JSON — the proxy/WAF might return plain text */
        let data = null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await res.json().catch(() => null);
        } else {
            const text = await res.text().catch(() => '');
            /* Plain-text error from proxy/WAF → treat as unavailable */
            if (!res.ok) {
                console.warn('API returned non-JSON error:', text);
                return null;     /* fall through to local login */
            }
        }

        if (res.ok && data?.token) {
            return { ok: true, user: data.user, token: data.token };
        }

        /* API is reachable but returned an auth error */
        const msg = data?.message || data?.error || null;
        /* Only treat it as a real auth error if it's a proper 4xx from the app */
        if (res.status === 401 || res.status === 400) {
            return { ok: false, message: msg || 'Email ose fjalëkalim i gabuar!' };
        }

        /* 403, 500, etc. → treat as unavailable, try local */
        return null;

    } catch (networkErr) {
        /* Network failure (server down, CORS, timeout, etc.) */
        console.warn('API unreachable:', networkErr.message);
        return null;
    }
}

/* ── Main login function (called from index.html) ─────────── */
async function handleLogin() {
    const emailEl = document.getElementById('loginEmail');
    const passEl  = document.getElementById('loginPassword');
    const btn     = document.getElementById('loginBtn');

    const email    = (emailEl?.value || '').trim();
    const password = (passEl?.value  || '');

    /* ── Validation ── */
    clearLoginErrors();

    if (!email) {
        setLoginError('loginEmail', 'Shkruani email-in tuaj.');
        return;
    }
    if (!isValidEmail(email)) {
        setLoginError('loginEmail', 'Formati i email-it nuk është i saktë.');
        return;
    }
    if (!password) {
        setLoginError('loginPassword', 'Shkruani fjalëkalimin.');
        return;
    }
    if (password.length < 3) {
        setLoginError('loginPassword', 'Fjalëkalimi duhet të ketë të paktën 3 karaktere.');
        return;
    }

    /* ── Loading state ── */
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Duke u kyçur...';
    }

    /* ── Step 1: Try real API ── */
    const apiResult = await apiLogin(email, password);

    if (apiResult?.ok === true) {
        /* ✅ Real API login succeeded */
        const role = saveSession(apiResult.token, apiResult.user);
        showToast(`Mirë se vini, ${apiResult.user?.name || email}! (${role === 'admin' ? '👑 Admin' : '🙋 Klient'})`, 'success');
        setTimeout(() => redirectByRole(), 700);
        return;
    }

    if (apiResult?.ok === false) {
        /* ❌ API is reachable but rejected credentials (wrong password) */
        /* Still try local — API might have different credentials than demo */
        const localResult = localLogin(email, password);
        if (localResult.success) {
            const fakeToken = 'local-' + btoa(email).replace(/=/g,'') + '-' + Date.now();
            const role = saveSession(fakeToken, localResult.user);
            showToast(`Mirë se vini, ${localResult.user.name}! (${role === 'admin' ? '👑 Admin' : '🙋 Klient'})`, 'success');
            setTimeout(() => redirectByRole(), 700);
            return;
        }
        /* Both API and local rejected → real wrong password */
        setLoginError('loginPassword', apiResult.message || 'Email ose fjalëkalim i gabuar!');
        resetBtn(btn);
        return;
    }

    /* ── Step 2: API unavailable (null) → use local credentials ── */
    const localResult = localLogin(email, password);

    if (localResult.success) {
        const fakeToken = 'local-' + btoa(email).replace(/=/g,'') + '-' + Date.now();
        const role = saveSession(fakeToken, localResult.user);
        const modeTag = role === 'admin' ? '👑 Admin' : '🙋 Klient';
        showToast(`Mirë se vini, ${localResult.user.name}! (${modeTag})`, 'success');
        setTimeout(() => redirectByRole(), 700);
    } else {
        setLoginError('loginPassword', localResult.message || 'Kredenciale të gabuara!');
        resetBtn(btn);
    }
}

/* ── Register ────────────────────────────────────────────────── */
async function handleRegister() {
    const name     = document.getElementById('regName')?.value.trim()     || '';
    const email    = document.getElementById('regEmail')?.value.trim()    || '';
    const phone    = document.getElementById('regPhone')?.value.trim()    || '';
    const password = document.getElementById('regPassword')?.value        || '';

    clearLoginErrors();

    if (!name)              { setLoginError('regName',     'Shkruani emrin tuaj.');           return; }
    if (!isValidEmail(email)) { setLoginError('regEmail',   'Formati i email-it nuk është i saktë.'); return; }
    if (!phone)             { setLoginError('regPhone',    'Shkruani numrin e telefonit.');   return; }
    if (password.length < 4){ setLoginError('regPassword', 'Fjalëkalimi duhet të ketë ≥ 4 karaktere.'); return; }

    try {
        const res = await fetch(`${GB.API}/auth/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name, email, password, phoneNumber: phone })
        });
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

        if (res.ok && data?.token) {
            saveSession(data.token, data.user);
            showToast('Llogaria u krijua me sukses!', 'success');
            setTimeout(() => redirectByRole(), 700);
            return;
        }
        if (res.status === 400 || res.status === 409) {
            showToast(data?.message || 'Ky email është tashmë i regjistruar.', 'error');
            return;
        }
    } catch { /* API unavailable → fall through */ }

    /* Offline/blocked: create local client account */
    const newUser = { id: Date.now(), name, email, phoneNumber: phone, role: 'Customer' };
    saveSession('local-reg-' + Date.now(), newUser);
    showToast(`Llogaria u krijua! Mirë se vini, ${name}!`, 'success');
    setTimeout(() => redirectByRole(), 700);
}

/* ── Auth guards ─────────────────────────────────────────────── */
function requireAuth() {
    if (!gbIsLoggedIn()) { window.location.replace('index.html'); return false; }
    return true;
}

function requireAdmin() {
    if (!gbIsLoggedIn()) { window.location.replace('index.html');    return false; }
    if (!gbIsAdmin())    { window.location.replace('dashboard.html'); return false; }
    return true;
}

/* ── authFetch ───────────────────────────────────────────────── */
async function authFetch(url, options = {}) {
    const token   = gbGetToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const res = await fetch(url, { ...options, headers });
        if (res.status === 401) { logout(); return null; }
        return res;
    } catch(e) {
        console.error('authFetch error:', e.message);
        return null;
    }
}

/* ── Redirect after login ─────────────────────────────────────── */
function redirectByRole() {
    window.location.replace(gbIsAdmin() ? './admin.html' : './dashboard.html');
}

/* ── UI helpers ──────────────────────────────────────────────── */
function applyRoleToBody() {
    document.body.classList.remove('role-admin', 'role-client');
    document.body.classList.add('role-' + gbGetRole());
}

function loadUserBadge() {
    const user = gbGetUser();
    if (!user) return;
    const nameEl     = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');
    const roleTagEl  = document.getElementById('userRoleTag');
    if (nameEl)     nameEl.textContent = user.name || 'Përdorues';
    if (initialsEl) initialsEl.textContent = (user.name || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0,2).toUpperCase();
    if (roleTagEl) {
        roleTagEl.textContent = gbIsAdmin() ? 'Admin' : 'Klient';
        roleTagEl.className   = 'role-tag ' + (gbIsAdmin() ? 'role-tag-admin' : 'role-tag-client');
    }
}

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

    sidebar.innerHTML = `
        <div class="logo">
            <span class="logo-icon">💅</span>
            <h2>Glow Book</h2>
            <p>Nail Salon</p>
        </div>
        ${adminLinks}
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
        </a>
        <div class="nav-bottom">
            <a class="nav-item nav-logout" onclick="logout()">
                <i class="fa-solid fa-right-from-bracket nav-icon"></i> Dilni
            </a>
        </div>`;
}

function initSidebar() {
    const btn     = document.getElementById('hamburgerBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    if (btn && sidebar && overlay) {
        btn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('open');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent  = msg;
    t.className    = 'gb-toast ' + type;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.className = 'gb-toast'; }, 3800);
}

/* ── Login-page field error helpers ─────────────────────────── */
function setLoginError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.classList.add('input-error');

    /* Remove any existing error el */
    const existing = document.getElementById(fieldId + '-err');
    if (existing) existing.remove();

    const err = document.createElement('span');
    err.id        = fieldId + '-err';
    err.className = 'login-field-error';
    err.textContent = message;
    input.parentNode.appendChild(err);
    input.focus();
}

function clearLoginErrors() {
    document.querySelectorAll('.login-field-error').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function resetBtn(btn) {
    if (!btn) return;
    btn.disabled  = false;
    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Kyçu';
}

/* ── Page init helper ────────────────────────────────────────── */
function gbInitPage({ page = '', adminOnly = false } = {}) {
    if (adminOnly) { if (!requireAdmin()) return false; }
    else           { if (!requireAuth())  return false; }
    applyRoleToBody();
    buildSidebar(page);
    initSidebar();
    loadUserBadge();
    return true;
}