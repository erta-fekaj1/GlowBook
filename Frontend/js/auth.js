/* ================================================================
   GLOWBOOK — auth.js   (unified auth + db + RBAC)
   Single file. Load it first on every page.

   What it does:
     • Stores users, appointments, services in localStorage
     • Handles register / login / logout
     • Detects roles: 'admin' | 'client'
     • Guards pages (redirect if unauthorised)
     • Builds sidebar with role-aware links
     • Exposes GB object used by every page
   ================================================================ */

'use strict';

/* ── localStorage keys ─────────────────────────────────────── */
const _K = {
    USERS   : 'gb_users',
    TOKEN   : 'gb_token',
    ME      : 'gb_me',
    ROLE    : 'gb_role',
    APPTS   : 'gb_appointments',
    SVCS    : 'gb_services',
    DESIGNS : 'gb_designs',
};

/* ── Tiny localStorage read/write helpers ──────────────────── */
const _r = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const _w = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const _nextId = arr => arr.length ? Math.max(...arr.map(x => x.id ?? 0)) + 1 : 1;
const _now    = () => new Date().toISOString();

/* ── Password obfuscation (not cryptographic) ──────────────── */
function _hash(pw) {
    let h = 5381;
    for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) ^ pw.charCodeAt(i);
    return 'h' + (h >>> 0).toString(36);
}

/* ================================================================
   SEED — runs once on every page load
   ================================================================ */
function _seed() {
    /* ── Admin accounts ── */
    const users   = _r(_K.USERS) ?? [];
    const seeded  = [...users];
    let dirty     = false;

    const ADMINS = [
        { id:1, name:'Admin GlowBook', email:'admin@glowbook.com', pass:'admin123', phone:'044000000' },
        { id:2, name:'Admin',           email:'admin@gmail.com',    pass:'admin123', phone:'044000001' },
    ];
    for (const a of ADMINS) {
        if (!seeded.find(u => u.email === a.email)) {
            seeded.push({ id:a.id, name:a.name, email:a.email,
                passwordHash:_hash(a.pass), phone:a.phone,
                role:'Admin', createdAt:_now() });
            dirty = true;
        }
    }
    if (dirty) _w(_K.USERS, seeded);

    /* ── Default services ── */
    if (!_r(_K.SVCS)) {
        _w(_K.SVCS, [
            { id:1, name:'Manikyr Klasik',  price:15, duration:45,  desc:'Trajtim klasik i thonjve me lakues dhe lak.'   },
            { id:2, name:'Gel Polish',       price:20, duration:60,  desc:'Lak gjel afatgjatë deri 3 javë.'              },
            { id:3, name:'Akryl Full Set',   price:35, duration:90,  desc:'Thonjë akryl të plotë.'                        },
            { id:4, name:'Pedikyri Klasik',  price:18, duration:45,  desc:'Trajtim relaksues i këmbëve.'                 },
            { id:5, name:'Nail Art',         price:25, duration:60,  desc:'Dizajne artistike me dorë.'                   },
            { id:6, name:'Ombre Nails',      price:30, duration:75,  desc:'Efekt gradual dy ngjyrash.'                   },
            { id:7, name:'French Manikyr',   price:22, duration:50,  desc:'Stil klasik francez.'                         },
            { id:8, name:'Spa Manikyr',      price:28, duration:60,  desc:'Manikyr me maskë dhe masazh.'                 },
        ]);
    }

    /* ── Empty appointments array ── */
    if (!_r(_K.APPTS)) _w(_K.APPTS, []);

    /* ── Default gallery designs ── */
    if (!_r(_K.DESIGNS)) {
        _w(_K.DESIGNS, [
            { id:1,  name:'French Classic', emoji:'🤍', category:'French',  complexity:'E lehtë',    price:15, duration:30,  desc:'Dizajni klasik francez me majë të bardhë elegante.',    tags:['Klasik','Elegant'],  likes:24, liked:false, bg:'#F8F4FF' },
            { id:2,  name:'Pink Ombre',      emoji:'🌸', category:'Ombre',   complexity:'Mesatare',   price:25, duration:45,  desc:'Kalim gradual nga rozë e çelët te ngjyra më e thellë.', tags:['Romantike','Ombre'], likes:31, liked:false, bg:'#FFF0F5' },
            { id:3,  name:'Glitter Bomb',    emoji:'✨', category:'Glitter', complexity:'E lehtë',    price:20, duration:40,  desc:'Shkëlqim dhe glamour në çdo gisht.',                    tags:['Festë','Glamour'],   likes:18, liked:false, bg:'#FFFBF0' },
            { id:4,  name:'Floral Dream',    emoji:'🌺', category:'Floral',  complexity:'E vështirë', price:40, duration:90,  desc:'Lule të vogla të vizatuara me dorë.',                   tags:['Art','Lule'],        likes:45, liked:false, bg:'#F0FFF4' },
            { id:5,  name:'Gel Nude',        emoji:'🍑', category:'Gel',     complexity:'E lehtë',    price:18, duration:35,  desc:'Ngjyrë neutrale dhe naturale.',                         tags:['Neutral','Gel'],     likes:29, liked:false, bg:'#FFF5F0' },
            { id:6,  name:'Galaxy Nails',    emoji:'🌌', category:'Glitter', complexity:'E vështirë', price:45, duration:100, desc:'Efekt galaktik me ngjyra të errëta.',                   tags:['Galaxy','Unique'],   likes:52, liked:false, bg:'#F0F0FF' },
            { id:7,  name:'Marble Effect',   emoji:'🖤', category:'Gel',     complexity:'E vështirë', price:38, duration:80,  desc:'Efekt mermer luksoz me vija delikate.',                 tags:['Luks','Marble'],     likes:37, liked:false, bg:'#F8F8F8' },
            { id:8,  name:'Floral Ombre',    emoji:'🌸', category:'Floral',  complexity:'E vështirë', price:50, duration:120, desc:'Kombinim ombre me lule të vizatuara.',                  tags:['Trending','Lule'],   likes:61, liked:false, bg:'#FFF0F8' },
            { id:9,  name:'Red Glam',        emoji:'❤️', category:'Gel',     complexity:'E lehtë',    price:16, duration:30,  desc:'Ngjyrë e kuqe klasike ikonike.',                        tags:['Klasik','Red'],      likes:33, liked:false, bg:'#FFF0F0' },
            { id:10, name:'Baby Blue',       emoji:'💙', category:'Ombre',   complexity:'Mesatare',   price:22, duration:45,  desc:'Kalim i butë në ngjyrë blu.',                           tags:['Pastel','Blue'],     likes:27, liked:false, bg:'#F0F8FF' },
            { id:11, name:'Gold Tips',       emoji:'⭐', category:'French',  complexity:'Mesatare',   price:28, duration:50,  desc:'Majë të arta elegante.',                               tags:['Gold','French'],     likes:41, liked:false, bg:'#FFFDF0' },
            { id:12, name:'Lavender Gel',    emoji:'💜', category:'Gel',     complexity:'E lehtë',    price:17, duration:30,  desc:'Ngjyrë lavanderi e butë.',                             tags:['Pastel','Purple'],   likes:35, liked:false, bg:'#F8F0FF' },
        ]);
    }
}

/* ================================================================
   PUBLIC API — window.GB
   ================================================================ */
window.GB = {

    /* ── Session ─────────────────────────────────────────────── */
    getMe    () { return _r(_K.ME);   },
    getRole  () { return _r(_K.ROLE) ?? 'client'; },
    getToken () { return localStorage.getItem(_K.TOKEN); },
    isAdmin  () { return this.getRole() === 'admin'; },
    isClient () { return this.getRole() === 'client'; },
    isLoggedIn() { return !!this.getToken(); },

    _detectRole(user) {
        if (!user) return 'client';
        const ADMIN_EMAILS = ['admin@glowbook.com', 'admin@gmail.com'];
        if (user.role?.toLowerCase() === 'admin') return 'admin';
        if (ADMIN_EMAILS.includes(user.email?.toLowerCase())) return 'admin';
        return 'client';
    },

    _saveSession(user) {
        const role  = this._detectRole(user);
        const token = 'gb-' + _hash(user.email + Date.now()).slice(0, 12);
        localStorage.setItem(_K.TOKEN, token);
        _w(_K.ME,   user);
        _w(_K.ROLE, role);
        return role;
    },

    /* ── Auth ────────────────────────────────────────────────── */
    register({ name, email, password, phone = '' }) {
        if (!name?.trim())       return { ok:false, error:'Shkruani emrin tuaj.' };
        if (!email?.trim())      return { ok:false, error:'Shkruani email-in.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return { ok:false, error:'Email i pavlefshëm.' };
        if (!password || password.length < 4) return { ok:false, error:'Fjalëkalimi duhet ≥ 4 karaktere.' };

        const norm  = email.trim().toLowerCase();
        const users = _r(_K.USERS) ?? [];

        if (users.find(u => u.email === norm)) {
            return { ok:false, error:'Ky email është tashmë i regjistruar.' };
        }

        const newUser = {
            id: _nextId(users), name:name.trim(), email:norm,
            passwordHash: _hash(password), phone:phone.trim(),
            role:'Customer', createdAt:_now(),
        };
        _w(_K.USERS, [...users, newUser]);

        const { passwordHash:_, ...safe } = newUser;
        const role = this._saveSession(safe);
        return { ok:true, user:safe, role };
    },

    login(email, password) {
        if (!email || !password) return { ok:false, error:'Plotësoni të gjitha fushat.' };

        const norm  = email.trim().toLowerCase();
        const users = _r(_K.USERS) ?? [];
        const found = users.find(u => u.email === norm);

        if (!found) return { ok:false, error:'Nuk u gjet asnjë llogari me këtë email.' };
        if (found.passwordHash !== _hash(password.trim())) return { ok:false, error:'Fjalëkalimi është i gabuar.' };

        const { passwordHash:_, ...safe } = found;
        const role = this._saveSession(safe);
        return { ok:true, user:safe, role };
    },

    logout() {
        [_K.TOKEN, _K.ME, _K.ROLE].forEach(k => localStorage.removeItem(k));
        window.location.replace('index.html');
    },

    /* ── Guards ──────────────────────────────────────────────── */
    requireAuth() {
        if (!this.isLoggedIn()) { window.location.replace('index.html'); return false; }
        return true;
    },
    requireAdmin() {
        if (!this.isLoggedIn()) { window.location.replace('index.html');    return false; }
        if (!this.isAdmin())    { window.location.replace('dashboard.html'); return false; }
        return true;
    },

    /* ── Users store ─────────────────────────────────────────── */
    users: {
        getAll    () { return _r(_K.USERS) ?? []; },
        getById   (id)    { return this.getAll().find(u => u.id === id) ?? null; },
        getByEmail(email) { return this.getAll().find(u => u.email === email.toLowerCase()) ?? null; },
        count     ()      { return this.getAll().length; },
        admins    ()      { return this.getAll().filter(u => u.role === 'Admin'); },
        customers ()      { return this.getAll().filter(u => u.role !== 'Admin'); },

        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(u => u.id === id);
            if (idx < 0) return { ok:false, error:'Përdoruesi nuk u gjet.' };
            if (fields.password) { fields.passwordHash = _hash(fields.password); delete fields.password; }
            if (fields.email) fields.email = fields.email.toLowerCase();
            all[idx] = { ...all[idx], ...fields };
            _w(_K.USERS, all);
            const { passwordHash:_, ...safe } = all[idx];
            return { ok:true, user:safe };
        },

        delete(id) {
            const all = this.getAll().filter(u => u.id !== id);
            _w(_K.USERS, all);
            return { ok:true };
        },

        safe(u) { const { passwordHash:_, ...s } = (u ?? {}); return s; },
        safeAll() { return this.getAll().map(u => this.safe(u)); },
    },

    /* ── Appointments store ──────────────────────────────────── */
    appointments: {
        getAll   ()      { return _r(_K.APPTS) ?? []; },
        getById  (id)    { return this.getAll().find(a => a.id === id) ?? null; },
        getByUser(email) {
            const norm = email.toLowerCase();
            return this.getAll().filter(a => a.userEmail === norm);
        },

        add({ userEmail, userName, serviceId, serviceName, date, notes='', status='Pending' }) {
            if (!userEmail || !serviceId || !date) {
                return { ok:false, error:'Email, shërbimi dhe data janë të detyrueshme.' };
            }
            const all  = this.getAll();
            const appt = {
                id: _nextId(all),
                userEmail: userEmail.toLowerCase(), userName,
                serviceId, serviceName, date,
                notes: notes.trim(), status,
                createdAt: _now(),
            };
            _w(_K.APPTS, [...all, appt]);
            return { ok:true, appointment:appt };
        },

        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(a => a.id === id);
            if (idx < 0) return { ok:false, error:'Takimi nuk u gjet.' };
            all[idx] = { ...all[idx], ...fields };
            _w(_K.APPTS, all);
            return { ok:true, appointment:all[idx] };
        },

        delete(id) {
            _w(_K.APPTS, this.getAll().filter(a => a.id !== id));
            return { ok:true };
        },

        count   ()  { return this.getAll().length; },
        pending ()  { return this.getAll().filter(a => a.status === 'Pending'); },
        confirmed() { return this.getAll().filter(a => a.status === 'Confirmed'); },
        done    ()  { return this.getAll().filter(a => a.status === 'Done'); },

        todayCount() {
            const today = new Date().toDateString();
            return this.getAll().filter(a => new Date(a.date).toDateString() === today).length;
        },
    },

    /* ── Services store ──────────────────────────────────────── */
    services: {
        getAll  ()   { return _r(_K.SVCS) ?? []; },
        getById (id) { return this.getAll().find(s => s.id === id) ?? null; },
        count   ()   { return this.getAll().length; },

        add({ name, price, duration=0, desc='' }) {
            if (!name?.trim() || price == null) return { ok:false, error:'Emri dhe çmimi janë të detyrueshëm.' };
            const all = this.getAll();
            const svc = { id:_nextId(all), name:name.trim(), price:+price, duration:+duration, desc:desc.trim() };
            _w(_K.SVCS, [...all, svc]);
            return { ok:true, service:svc };
        },

        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(s => s.id === id);
            if (idx < 0) return { ok:false, error:'Shërbimi nuk u gjet.' };
            if (fields.price)    fields.price    = +fields.price;
            if (fields.duration) fields.duration = +fields.duration;
            all[idx] = { ...all[idx], ...fields };
            _w(_K.SVCS, all);
            return { ok:true, service:all[idx] };
        },

        delete(id) {
            _w(_K.SVCS, this.getAll().filter(s => s.id !== id));
            return { ok:true };
        },
    },

    /* ── Designs store ───────────────────────────────────────── */
    designs: {
        getAll ()    { return _r(_K.DESIGNS) ?? []; },
        save   (arr) { _w(_K.DESIGNS, arr); },
        count  ()    { return this.getAll().length; },

        add(design) {
            const all = this.getAll();
            const d   = { ...design, id:_nextId(all), likes:0, liked:false };
            _w(_K.DESIGNS, [...all, d]);
            return d;
        },
        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(d => d.id === id);
            if (idx < 0) return null;
            all[idx] = { ...all[idx], ...fields };
            _w(_K.DESIGNS, all);
            return all[idx];
        },
        delete(id) { _w(_K.DESIGNS, this.getAll().filter(d => d.id !== id)); },
    },

    /* ================================================================
       UI HELPERS
       ================================================================ */

    /* Apply role class to <body> so CSS can show/hide [data-admin] */
    applyRole() {
        document.body.classList.toggle('role-admin',  this.isAdmin());
        document.body.classList.toggle('role-client', this.isClient());
    },

    /* Populate topbar user badge */
    loadBadge() {
        const me = this.getMe();
        if (!me) return;
        const nameEl = document.getElementById('userName');
        const iniEl  = document.getElementById('userInitials');
        const tagEl  = document.getElementById('userRoleTag');
        if (nameEl) nameEl.textContent = me.name ?? 'Përdorues';
        if (iniEl)  iniEl.textContent  = (me.name ?? 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
        if (tagEl) {
            tagEl.textContent = this.isAdmin() ? 'Admin' : 'Klient';
            tagEl.className   = 'role-tag ' + (this.isAdmin() ? 'role-tag-admin' : 'role-tag-client');
        }
    },

    /* Build role-aware sidebar */
    buildSidebar(active = '') {
        const sb = document.getElementById('sidebar');
        if (!sb) return;

        const li = (page, href, icon, label) =>
            `<a class="nav-item${active===page?' active':''}" href="${href}">
                <i class="${icon} nav-icon"></i> ${label}
             </a>`;

        const adminLinks = this.isAdmin() ? `
            ${li('admin',   'admin.html',   'fa-solid fa-shield-halved', 'Admin Panel')}
            ${li('users',   'users.html',   'fa-solid fa-users',         'Përdoruesit')}
        ` : '';

        sb.innerHTML = `
            <div class="logo">
                <span class="logo-icon">💅</span>
                <h2>Glow Book</h2>
                <p>Nail Salon</p>
            </div>
            ${adminLinks}
            ${li('dashboard',    'dashboard.html',    'fa-solid fa-house',              'Dashboard')}
            ${li('appointments', 'appointments.html', 'fa-regular fa-calendar-check',   'Takimet')}
            ${li('services',     'services.html',     'fa-solid fa-spa',                'Shërbimet')}
            ${li('gallery',      'gallery.html',      'fa-regular fa-images',           'Galeria')}
            ${li('payment',      'payment.html',      'fa-solid fa-credit-card',        'Pagesa')}
            <div class="nav-bottom">
                <a class="nav-item nav-logout" onclick="GB.logout()">
                    <i class="fa-solid fa-right-from-bracket nav-icon"></i> Dilni
                </a>
            </div>`;
    },

    /* Mobile sidebar toggle */
    initSidebar() {
        const btn = document.getElementById('hamburgerBtn');
        const ov  = document.getElementById('sidebarOverlay');
        const sb  = document.getElementById('sidebar');
        if (!btn || !ov || !sb) return;
        btn.addEventListener('click', () => { sb.classList.toggle('open'); ov.classList.toggle('open'); });
        ov.addEventListener('click',  () => { sb.classList.remove('open'); ov.classList.remove('open'); });
    },

    /* Toast notification */
    toast(msg, type='info') {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.className   = 'gb-toast ' + type;
        clearTimeout(t._t);
        t._t = setTimeout(() => t.className = 'gb-toast', 3800);
    },

    /* ── One-call page init ──────────────────────────────────── */
    /*
       Call at the top of every protected page's <script>:
         GB.init({ page: 'gallery' })           — any logged-in user
         GB.init({ page: 'admin', admin: true }) — admin only
    */
    init({ page='', admin=false }={}) {
        if (admin) { if (!this.requireAdmin()) return false; }
        else       { if (!this.requireAuth())  return false; }
        this.applyRole();
        this.buildSidebar(page);
        this.initSidebar();
        this.loadBadge();
        return true;
    },

    /* ── Debug helpers (call from browser console) ───────────── */
    dump()  {
        console.group('GlowBook Storage');
        console.log('Me:',           this.getMe());
        console.log('Role:',         this.getRole());
        console.log('Users:',        this.users.safeAll());
        console.log('Appointments:', this.appointments.getAll());
        console.log('Services:',     this.services.getAll());
        console.groupEnd();
    },
    reset() {
        Object.values(_K).forEach(k => localStorage.removeItem(k));
        _seed();
        console.log('Reset complete. Reload the page.');
    },
};

/* legacy aliases so old auth.js calls still work */
window.logout       = ()            => GB.logout();
window.requireAuth  = ()            => GB.requireAuth();
window.showToast    = (m,t)         => GB.toast(m,t);
window.gbIsAdmin    = ()            => GB.isAdmin();
window.gbIsClient   = ()            => GB.isClient();
window.gbGetUser    = ()            => GB.getMe();
window.gbGetRole    = ()            => GB.getRole();
window.gbIsLoggedIn = ()            => GB.isLoggedIn();
window.gbInitPage   = (opts)        => GB.init({ page: opts?.page, admin: opts?.adminOnly });
window.saveSession  = (tok,user)    => { GB._saveSession(user); };
window.redirectByRole = ()          => { window.location.replace(GB.isAdmin() ? './admin.html' : './dashboard.html'); };

/* ── Auto-seed on every page load ──────────────────────────── */
_seed();