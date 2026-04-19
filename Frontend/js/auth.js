// ============================================================
// AUTH HELPER - menaxhon JWT token në të gjitha faqet
// ============================================================

const API = 'https://glowbook-1.onrender.com';

function saveAuth(data) {
    localStorage.setItem('glowbook_token', data.token);
    localStorage.setItem('glowbook_user', JSON.stringify(data.user));
}

function getToken() {
    return localStorage.getItem('glowbook_token');
}

function getUser() {
    const user = localStorage.getItem('glowbook_user');
    try {
        return user ? JSON.parse(user) : null;
    } catch (e) { return null; }
}

function isLoggedIn() {
    return !!getToken();
}

// DILNI (LOGOUT) - VERSIONI I BLINDUAR
function logout() {
    console.log("Duke dalë...");
    
    // 1. I tregojmë faqes tjetër që po dalim me qëllim (Flag)
    sessionStorage.setItem('glowbook_logging_out', 'true');
    
    // 2. Pastrojmë memorien totalisht
    localStorage.clear();
    sessionStorage.removeItem('glowbook_token');
    
    // 3. Ridrejtimi i menjëhershëm
    window.location.replace('./index.html');
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.replace('./index.html');
        return false;
    }
    return true;
}

async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            logout();
            return null;
        }
        return response;
    } catch (error) {
        console.error("Gabim në kërkesë:", error);
        return null;
    }
}

function loadUserBadge() {
    const user = getUser();
    if (!user || !user.name) return;
    const nameEl = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');
    if (nameEl) nameEl.textContent = user.name;
    if (initialsEl) {
        const initials = user.name.split(' ').filter(p => p.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase();
        initialsEl.textContent = initials;
    }
}