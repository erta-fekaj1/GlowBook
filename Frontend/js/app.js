// ============================================================
// KONFIGURIMI I API-së (Duhet të përdorësh /api/user)
// ============================================================
const API_URL = 'https://glowbook-1.onrender.com/api/user';

let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mbrojtja e faqes: Nëse nuk ka token, ktheje te login
    if (!requireAuth()) return;

    loadUsers();
    loadUserBadge(); // Shfaq emrin e adminit lart

    document.getElementById('addUserForm').addEventListener('submit', addUser);
    document.getElementById('searchBtn').addEventListener('click', () => loadUsers());
    document.getElementById('refreshBtn').addEventListener('click', refreshUsers);
    document.getElementById('saveEditBtn').addEventListener('click', updateUser);
});

async function loadUsers() {
    const filterName = document.getElementById('filterName').value;
    const filterRole = document.getElementById('filterRole').value;
    
    let url = API_URL;
    const params = [];
    if (filterName) params.push(`name=${encodeURIComponent(filterName)}`);
    if (filterRole) params.push(`role=${encodeURIComponent(filterRole)}`);
    if (params.length) url += `?${params.join('&')}`;
    
    try {
        // 2. NDRYSHIMI: Përdorim authFetch në vend të fetch
        const response = await authFetch(url);
        if (!response || !response.ok) throw new Error('Gabim në ngarkim');
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Gabim gjatë ngarkimit të përdoruesve');
    }
}

// ... displayUsers mbetet e njëjtë ...

async function addUser(e) {
    e.preventDefault();
    
    const user = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phoneNumber: document.getElementById('phone').value,
        role: "Client" // Sigurohu që po dërgon një Role default
    };
    
    try {
        // 3. NDRYSHIMI: Përdorim authFetch me metodën POST
        const response = await authFetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(user)
        });
        
        if (response && response.ok) {
            showToast('success', 'Përdoruesi u shtua me sukses!');
            document.getElementById('addUserForm').reset();
            loadUsers();
        } else {
            showToast('error', 'Gabim gjatë shtimit. Kontrolloni të dhënat.');
        }
    } catch (error) {
        showToast('error', 'Gabim gjatë lidhjes me serverin');
    }
}

async function editUser(id) {
    try {
        // 4. NDRYSHIMI: authFetch për të marrë një përdorues specifik
        const response = await authFetch(`${API_URL}/${id}`);
        if (!response || !response.ok) throw new Error('User not found');
        
        const user = await response.json();
        
        currentEditId = user.id;
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPhone').value = user.phoneNumber;
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    } catch (error) {
        showToast('error', 'Nuk keni autorizim për të edituar');
    }
}

async function updateUser() {
    const user = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phoneNumber: document.getElementById('editPhone').value
    };
    
    try {
        // 5. NDRYSHIMI: authFetch me PUT
        const response = await authFetch(`${API_URL}/${currentEditId}`, {
            method: 'PUT',
            body: JSON.stringify(user)
        });
        
        if (response && response.ok) {
            showToast('success', 'Përdoruesi u përditësua me sukses!');
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            loadUsers();
        }
    } catch (error) {
        showToast('error', 'Gabim gjatë përditësimit');
    }
}

async function deleteUser(id) {
    if (!confirm('A jeni i sigurt që doni ta fshini këtë përdorues?')) return;
    
    try {
        // 6. NDRYSHIMI: authFetch me DELETE
        const response = await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
        
        if (response && response.ok) {
            showToast('success', 'Përdoruesi u fshi me sukses!');
            loadUsers();
        }
    } catch (error) {
        showToast('error', 'Nuk keni autorizim për të fshirë');
    }
}

