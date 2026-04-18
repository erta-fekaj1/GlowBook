// ============================================================
// AUTH HELPER - menaxhon JWT token në të gjitha faqet
// ============================================================

const API = 'https://glowbook-1.onrender.com';

// Ruaj token pas login
function saveAuth(data) {
    localStorage.setItem('glowbook_token', data.token);
    localStorage.setItem('glowbook_user', JSON.stringify(data.user));
}

// Merr tokenin
function getToken() {
    return localStorage.getItem('glowbook_token');
}

// Merr userin
function getUser() {
    const user = localStorage.getItem('glowbook_user');
    return user ? JSON.parse(user) : null;
}

// Kontrollo nëse është i kyçur
function isLoggedIn() {
    return !!getToken();
}

// Dilni
function logout() {
    localStorage.removeItem('glowbook_token');
    localStorage.removeItem('glowbook_user');
    window.location.href = 'login.html';
}

// Auth Guard — ridrejto te login nëse nuk është i kyçur
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fetch me token automatik
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Nëse token ka skaduar, ridrejto te login
    if (response.status === 401) {
        logout();
        return null;
    }

    return response;
}

// Shfaq emrin e userit në navbar
function loadUserBadge() {
    const user = getUser();
    if (!user) return;

    const nameEl     = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');

    if (nameEl)     nameEl.textContent     = user.name;
    if (initialsEl) initialsEl.textContent = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}