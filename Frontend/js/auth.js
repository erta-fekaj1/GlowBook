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
    try {
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

// Kontrollo nëse është i kyçur
function isLoggedIn() {
    return !!getToken();
}

// Dilni (Logout) - Versioni i Sigurt
function logout() {
    // Fshijmë totalisht memorien e browser-it për këtë faqe
    localStorage.clear();
    sessionStorage.clear();

    console.log("Duke dalë...");

    // Përdorim replace që mos të ketë mundësi kthimi "Back"
    window.location.replace('./index.html');
}

// Auth Guard — ridrejto te login nëse nuk është i kyçur
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.replace('./index.html');
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

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Nëse token ka skaduar (401), bëj logout automatik
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

// Shfaq emrin e userit në navbar
function loadUserBadge() {
    const user = getUser();
    if (!user || !user.name) return;

    const nameEl = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');

    if (nameEl) nameEl.textContent = user.name;
    
    if (initialsEl) {
        const initials = user.name
            .split(' ')
            .filter(part => part.length > 0)
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        initialsEl.textContent = initials;
    }
}