const API_URL = 'http://localhost:5160/api/users';

let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

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
        const response = await fetch(url);
        if (!response.ok) throw new Error('Gabim në ngarkim');
        
        const users = await response.json();
        displayUsers(users);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Gabim gjatë ngarkimit të përdoruesve');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTable');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nuk ka përdorues të regjistruar</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td><strong>${escapeHtml(user.name)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge ${user.role === 'Admin' ? 'bg-danger' : 'bg-info'}">${user.role}</span></td>
            <td>${escapeHtml(user.phoneNumber)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function addUser(e) {
    e.preventDefault();
    
    const user = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phoneNumber: document.getElementById('phone').value
    };
    
    if (!user.name || !user.email || !user.password || !user.phoneNumber) {
        showToast('error', 'Ju lutem plotësoni të gjitha fushat!');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        if (response.ok) {
            showToast('success', 'Përdoruesi u shtua me sukses!');
            document.getElementById('addUserForm').reset();
            loadUsers();
        } else {
            const error = await response.json();
            showToast('error', error.message || 'Gabim gjatë shtimit');
        }
    } catch (error) {
        showToast('error', 'Gabim gjatë shtimit të përdoruesit');
    }
}

async function editUser(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('User not found');
        
        const user = await response.json();
        
        currentEditId = user.id;
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editPhone').value = user.phoneNumber;
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    } catch (error) {
        showToast('error', 'Gabim gjatë ngarkimit të përdoruesit');
    }
}

async function updateUser() {
    const user = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phoneNumber: document.getElementById('editPhone').value
    };
    
    if (!user.name || !user.email || !user.phoneNumber) {
        showToast('error', 'Ju lutem plotësoni të gjitha fushat!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        if (response.ok) {
            showToast('success', 'Përdoruesi u përditësua me sukses!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
            modal.hide();
            loadUsers();
        } else {
            const error = await response.json();
            showToast('error', error.message || 'Gabim gjatë përditësimit');
        }
    } catch (error) {
        showToast('error', 'Gabim gjatë përditësimit të përdoruesit');
    }
}

async function deleteUser(id) {
    if (!confirm('A jeni i sigurt që doni ta fshini këtë përdorues?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            showToast('success', 'Përdoruesi u fshi me sukses!');
            loadUsers();
        } else {
            showToast('error', 'Gabim gjatë fshirjes');
        }
    } catch (error) {
        showToast('error', 'Gabim gjatë fshirjes së përdoruesit');
    }
}

function refreshUsers() {
    document.getElementById('filterName').value = '';
    document.getElementById('filterRole').value = '';
    loadUsers();
}

function showToast(type, message) {
    const toastContainer = document.querySelector('.toast-container') || (() => {
        const div = document.createElement('div');
        div.className = 'toast-container';
        document.body.appendChild(div);
        return div;
    })();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0 fade show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}