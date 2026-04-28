/* ================================================================
   GLOWBOOK — db.js
   Complete localStorage persistence layer.
   Handles: users, sessions, appointments, services, bookings.

   Load order in HTML:
     <script src="../js/db.js"></script>      ← first
     <script src="../js/role.js"></script>    ← second (uses GBdb)
   ================================================================ */

'use strict';

/* ── Keys ───────────────────────────────────────────────────── */
const DB_KEYS = {
    USERS        : 'gb_users',
    SESSION_TOKEN: 'glowbook_token',
    SESSION_USER : 'glowbook_user',
    SESSION_ROLE : 'glowbook_role',
    APPOINTMENTS : 'gb_appointments',
    SERVICES     : 'gb_services',
    DESIGNS      : 'gb_gallery_designs',
};

/* ================================================================
   INTERNAL HELPERS
   ================================================================ */

function _read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { return null; }
}

function _write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch(e) { console.error('GBdb write error:', key, e); return false; }
}

function _nextId(arr) {
    if (!arr.length) return 1;
    return Math.max(...arr.map(x => x.id || 0)) + 1;
}

function _now() { return new Date().toISOString(); }

/* ================================================================
   USER STORE
   Schema: { id, name, email, passwordHash, phone, role, createdAt }
   ================================================================ */

/* Simple hash — NOT cryptographic, just obfuscation for localStorage */
function _hashPassword(pw) {
    let h = 0;
    for (let i = 0; i < pw.length; i++) {
        h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
    }
    return 'h' + Math.abs(h).toString(36);
}

const GBdb = {

    /* ── Seed default data if localStorage is empty ────────── */
    init() {
        /* Seed built-in admin accounts */
        const existing = _read(DB_KEYS.USERS) || [];
        const seeded = [...existing];
        let changed = false;

        const admins = [
            { id: 1, name: 'Admin GlowBook', email: 'admin@glowbook.com', password: 'admin123', phone: '044000000', role: 'Admin' },
            { id: 2, name: 'Admin',           email: 'admin@gmail.com',    password: 'admin123', phone: '044000001', role: 'Admin' },
        ];

        for (const a of admins) {
            const exists = seeded.some(u => u.email.toLowerCase() === a.email.toLowerCase());
            if (!exists) {
                seeded.push({
                    id          : a.id,
                    name        : a.name,
                    email       : a.email.toLowerCase(),
                    passwordHash: _hashPassword(a.password),
                    phone       : a.phone,
                    role        : a.role,
                    createdAt   : _now(),
                });
                changed = true;
            }
        }
        if (changed) _write(DB_KEYS.USERS, seeded);

        /* Seed default services if none exist */
        if (!_read(DB_KEYS.SERVICES)) {
            _write(DB_KEYS.SERVICES, [
                { id:1,  name:'Manikyr Klasik',   price:15, duration:45,  description:'Trajtim klasik i thonjve me lakues dhe lak.' },
                { id:2,  name:'Gel Polish',        price:20, duration:60,  description:'Lak gjel afatgjatë deri 3 javë.' },
                { id:3,  name:'Akryl Full Set',    price:35, duration:90,  description:'Thonjë akryl të plotë.' },
                { id:4,  name:'Pedikyri Klasik',   price:18, duration:45,  description:'Trajtim relaksues i këmbëve.' },
                { id:5,  name:'Nail Art',          price:25, duration:60,  description:'Dizajne artistike me dorë.' },
                { id:6,  name:'Ombre Nails',       price:30, duration:75,  description:'Efekt gradual dy ngjyrash.' },
                { id:7,  name:'French Manikyr',    price:22, duration:50,  description:'Stil klasik francez.' },
                { id:8,  name:'Spa Manikyr',       price:28, duration:60,  description:'Manikyr me maskë dhe masazh.' },
            ]);
        }

        /* Ensure appointments array exists */
        if (!_read(DB_KEYS.APPOINTMENTS)) {
            _write(DB_KEYS.APPOINTMENTS, []);
        }
    },

    /* ================================================================
       USER METHODS
       ================================================================ */

    users: {

        getAll() {
            return _read(DB_KEYS.USERS) || [];
        },

        getById(id) {
            return this.getAll().find(u => u.id === id) || null;
        },

        getByEmail(email) {
            const norm = (email || '').trim().toLowerCase();
            return this.getAll().find(u => u.email === norm) || null;
        },

        /* Register a new user — returns { ok, user, error } */
        register({ name, email, password, phone = '' }) {
            if (!name || !email || !password) {
                return { ok: false, error: 'Të gjitha fushat janë të detyrueshme.' };
            }
            if (password.length < 4) {
                return { ok: false, error: 'Fjalëkalimi duhet të ketë të paktën 4 karaktere.' };
            }

            const norm = email.trim().toLowerCase();
            const all  = this.getAll();

            if (all.some(u => u.email === norm)) {
                return { ok: false, error: 'Ky email është tashmë i regjistruar.' };
            }

            const newUser = {
                id          : _nextId(all),
                name        : name.trim(),
                email       : norm,
                passwordHash: _hashPassword(password),
                phone       : (phone || '').trim(),
                role        : 'Customer',
                createdAt   : _now(),
            };

            _write(DB_KEYS.USERS, [...all, newUser]);

            /* Return safe user (no passwordHash) */
            const { passwordHash: _, ...safeUser } = newUser;
            return { ok: true, user: safeUser };
        },

        /* Login — returns { ok, user, error } */
        login(email, password) {
            if (!email || !password) {
                return { ok: false, error: 'Email dhe fjalëkalimi janë të detyrueshëm.' };
            }

            const norm  = email.trim().toLowerCase();
            const found = this.getAll().find(u => u.email === norm);

            if (!found) {
                return { ok: false, error: 'Nuk u gjet asnjë llogari me këtë email.' };
            }

            if (found.passwordHash !== _hashPassword(password.trim())) {
                return { ok: false, error: 'Fjalëkalimi është i gabuar.' };
            }

            const { passwordHash: _, ...safeUser } = found;
            return { ok: true, user: safeUser };
        },

        /* Update a user — returns { ok, user, error } */
        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(u => u.id === id);
            if (idx === -1) return { ok: false, error: 'Përdoruesi nuk u gjet.' };

            /* Don't allow email change to one that already exists */
            if (fields.email) {
                const norm = fields.email.trim().toLowerCase();
                const conflict = all.find(u => u.email === norm && u.id !== id);
                if (conflict) return { ok: false, error: 'Ky email është tashmë i përdorur.' };
                fields.email = norm;
            }

            /* Hash new password if provided */
            if (fields.password) {
                fields.passwordHash = _hashPassword(fields.password);
                delete fields.password;
            }

            all[idx] = { ...all[idx], ...fields };
            _write(DB_KEYS.USERS, all);

            const { passwordHash: _, ...safeUser } = all[idx];
            return { ok: true, user: safeUser };
        },

        delete(id) {
            const all     = this.getAll();
            const updated = all.filter(u => u.id !== id);
            if (updated.length === all.length) return { ok: false, error: 'Nuk u gjet.' };
            _write(DB_KEYS.USERS, updated);
            return { ok: true };
        },

        count()     { return this.getAll().length; },
        admins()    { return this.getAll().filter(u => u.role === 'Admin'); },
        customers() { return this.getAll().filter(u => u.role === 'Customer'); },
    },

    /* ================================================================
       SESSION METHODS
       ================================================================ */

    session: {

        save(user) {
            const role  = GBdb.detectRole(user);
            const token = 'local-' + btoa((user.email || '') + ':' + Date.now()).replace(/=/g, '');
            localStorage.setItem(DB_KEYS.SESSION_TOKEN, token);
            localStorage.setItem(DB_KEYS.SESSION_USER,  JSON.stringify(user));
            localStorage.setItem(DB_KEYS.SESSION_ROLE,  role);
            return { token, role };
        },

        get() {
            try { return JSON.parse(localStorage.getItem(DB_KEYS.SESSION_USER) || 'null'); }
            catch { return null; }
        },

        getRole() { return localStorage.getItem(DB_KEYS.SESSION_ROLE) || 'client'; },
        getToken() { return localStorage.getItem(DB_KEYS.SESSION_TOKEN); },
        isActive() { return !!this.getToken(); },
        isAdmin()  { return this.getRole() === 'admin'; },

        clear() {
            [DB_KEYS.SESSION_TOKEN, DB_KEYS.SESSION_USER, DB_KEYS.SESSION_ROLE]
                .forEach(k => localStorage.removeItem(k));
        },
    },

    /* ================================================================
       APPOINTMENT METHODS
       Schema: {
         id, userEmail, userName, userId,
         service, serviceId, serviceName,
         date (ISO string), status, notes, createdAt
       }
       ================================================================ */

    appointments: {

        getAll() {
            return _read(DB_KEYS.APPOINTMENTS) || [];
        },

        getByUser(email) {
            const norm = (email || '').trim().toLowerCase();
            return this.getAll().filter(a => a.userEmail === norm);
        },

        getById(id) {
            return this.getAll().find(a => a.id === id) || null;
        },

        /* Add a new booking — returns { ok, appointment, error } */
        add({ userEmail, userName, userId, serviceName, serviceId, date, notes = '', status = 'Pending' }) {
            if (!userEmail || !serviceName || !date) {
                return { ok: false, error: 'Email, shërbimi dhe data janë të detyrueshme.' };
            }

            const all = this.getAll();
            const appt = {
                id         : _nextId(all),
                userEmail  : userEmail.trim().toLowerCase(),
                userName   : userName || userEmail.split('@')[0],
                userId     : userId   || null,
                serviceName: serviceName,
                serviceId  : serviceId || null,
                date       : date,
                status     : status,
                notes      : notes.trim(),
                createdAt  : _now(),
            };

            _write(DB_KEYS.APPOINTMENTS, [...all, appt]);
            return { ok: true, appointment: appt };
        },

        /* Update status or notes */
        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(a => a.id === id);
            if (idx === -1) return { ok: false, error: 'Takimi nuk u gjet.' };
            all[idx] = { ...all[idx], ...fields };
            _write(DB_KEYS.APPOINTMENTS, all);
            return { ok: true, appointment: all[idx] };
        },

        delete(id) {
            const all     = this.getAll();
            const updated = all.filter(a => a.id !== id);
            if (updated.length === all.length) return { ok: false, error: 'Nuk u gjet.' };
            _write(DB_KEYS.APPOINTMENTS, updated);
            return { ok: true };
        },

        pending()   { return this.getAll().filter(a => a.status === 'Pending'); },
        confirmed() { return this.getAll().filter(a => a.status === 'Confirmed'); },
        done()      { return this.getAll().filter(a => a.status === 'Done'); },
        count()     { return this.getAll().length; },
    },

    /* ================================================================
       SERVICE METHODS
       ================================================================ */

    services: {

        getAll() {
            return _read(DB_KEYS.SERVICES) || [];
        },

        getById(id) {
            return this.getAll().find(s => s.id === id) || null;
        },

        add({ name, price, duration, description = '' }) {
            if (!name || price === undefined) return { ok: false, error: 'Emri dhe çmimi janë të detyrueshëm.' };
            const all = this.getAll();
            const svc = { id: _nextId(all), name: name.trim(), price: parseFloat(price) || 0, duration: parseInt(duration) || 0, description: description.trim() };
            _write(DB_KEYS.SERVICES, [...all, svc]);
            return { ok: true, service: svc };
        },

        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(s => s.id === id);
            if (idx === -1) return { ok: false, error: 'Shërbimi nuk u gjet.' };
            if (fields.price)    fields.price    = parseFloat(fields.price);
            if (fields.duration) fields.duration = parseInt(fields.duration);
            all[idx] = { ...all[idx], ...fields };
            _write(DB_KEYS.SERVICES, all);
            return { ok: true, service: all[idx] };
        },

        delete(id) {
            const all     = this.getAll();
            const updated = all.filter(s => s.id !== id);
            if (updated.length === all.length) return { ok: false, error: 'Nuk u gjet.' };
            _write(DB_KEYS.SERVICES, updated);
            return { ok: true };
        },
    },

    /* ================================================================
       GALLERY / DESIGNS
       ================================================================ */

    designs: {

        getAll() {
            const stored = _read(DB_KEYS.DESIGNS);
            return stored || _defaultDesigns();
        },

        save(designs) { _write(DB_KEYS.DESIGNS, designs); },

        add(design) {
            const all   = this.getAll();
            const newD  = { ...design, id: _nextId(all), likes: 0, liked: false };
            _write(DB_KEYS.DESIGNS, [...all, newD]);
            return newD;
        },

        update(id, fields) {
            const all = this.getAll();
            const idx = all.findIndex(d => d.id === id);
            if (idx === -1) return null;
            all[idx] = { ...all[idx], ...fields };
            _write(DB_KEYS.DESIGNS, all);
            return all[idx];
        },

        delete(id) {
            const updated = this.getAll().filter(d => d.id !== id);
            _write(DB_KEYS.DESIGNS, updated);
        },
    },

    /* ================================================================
       ROLE DETECTION (shared utility)
       ================================================================ */

    detectRole(user) {
        if (!user) return 'client';
        const adminEmails = ['admin@glowbook.com', 'admin@gmail.com'];
        if (user.role && user.role.toLowerCase() === 'admin') return 'admin';
        if (user.email && adminEmails.includes(user.email.trim().toLowerCase())) return 'admin';
        if (user.name  && user.name.trim().toLowerCase() === 'admin') return 'admin';
        return 'client';
    },

    /* ================================================================
       EXPORT / DEBUG
       ================================================================ */

    /* Call from browser console: GBdb.dump() */
    dump() {
        console.group('GlowBook LocalStorage Dump');
        console.log('Users:',        this.users.getAll());
        console.log('Session:',      this.session.get());
        console.log('Role:',         this.session.getRole());
        console.log('Appointments:', this.appointments.getAll());
        console.log('Services:',     this.services.getAll());
        console.groupEnd();
    },

    /* Call from browser console: GBdb.reset() — clears everything */
    reset() {
        Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
        this.init();
        console.log('GBdb reset complete');
    },
};

/* ── Default gallery designs ──────────────────────────────── */
function _defaultDesigns() {
    return [
        { id:1,  name:'French Classic',  emoji:'🤍', category:'French',  complexity:'E lehtë',    price:15, duration:30,  desc:'Dizajni klasik francez me majë të bardhë elegante.',   tags:['Klasik','Elegant'],  likes:24, liked:false, bg:'#F8F4FF' },
        { id:2,  name:'Pink Ombre',       emoji:'🌸', category:'Ombre',   complexity:'Mesatare',   price:25, duration:45,  desc:'Kalim gradual nga rozë e çelët te ngjyra më e thellë.',tags:['Romantike','Ombre'], likes:31, liked:false, bg:'#FFF0F5' },
        { id:3,  name:'Glitter Bomb',     emoji:'✨', category:'Glitter', complexity:'E lehtë',    price:20, duration:40,  desc:'Shkëlqim dhe glamour në çdo gisht.',                   tags:['Festë','Glamour'],   likes:18, liked:false, bg:'#FFFBF0' },
        { id:4,  name:'Floral Dream',     emoji:'🌺', category:'Floral',  complexity:'E vështirë', price:40, duration:90,  desc:'Lule të vogla të vizatuara me dorë.',                   tags:['Art','Lule'],        likes:45, liked:false, bg:'#F0FFF4' },
        { id:5,  name:'Gel Nude',         emoji:'🍑', category:'Gel',     complexity:'E lehtë',    price:18, duration:35,  desc:'Ngjyrë neutrale dhe naturale.',                         tags:['Neutral','Gel'],     likes:29, liked:false, bg:'#FFF5F0' },
        { id:6,  name:'Galaxy Nails',     emoji:'🌌', category:'Glitter', complexity:'E vështirë', price:45, duration:100, desc:'Efekt galaktik me ngjyra të errëta.',                   tags:['Galaxy','Unique'],   likes:52, liked:false, bg:'#F0F0FF' },
        { id:7,  name:'Marble Effect',    emoji:'🖤', category:'Gel',     complexity:'E vështirë', price:38, duration:80,  desc:'Efekt mermer luksoz me vija delikate.',                 tags:['Luks','Marble'],     likes:37, liked:false, bg:'#F8F8F8' },
        { id:8,  name:'Floral Ombre',     emoji:'🌸', category:'Floral',  complexity:'E vështirë', price:50, duration:120, desc:'Kombinim ombre me lule të vizatuara.',                  tags:['Trending','Lule'],   likes:61, liked:false, bg:'#FFF0F8' },
        { id:9,  name:'Red Glam',         emoji:'❤️', category:'Gel',     complexity:'E lehtë',    price:16, duration:30,  desc:'Ngjyrë e kuqe klasike. Ikonike dhe e fuqishme.',        tags:['Klasik','Red'],      likes:33, liked:false, bg:'#FFF0F0' },
        { id:10, name:'Baby Blue',        emoji:'💙', category:'Ombre',   complexity:'Mesatare',   price:22, duration:45,  desc:'Kalim i butë në ngjyrë blu të çelët.',                  tags:['Pastel','Blue'],     likes:27, liked:false, bg:'#F0F8FF' },
        { id:11, name:'Gold Tips',        emoji:'⭐', category:'French',  complexity:'Mesatare',   price:28, duration:50,  desc:'Majë të arta elegante.',                               tags:['Gold','French'],     likes:41, liked:false, bg:'#FFFDF0' },
        { id:12, name:'Lavender Gel',     emoji:'💜', category:'Gel',     complexity:'E lehtë',    price:17, duration:30,  desc:'Ngjyrë lavanderi e butë dhe qetësuese.',               tags:['Pastel','Purple'],   likes:35, liked:false, bg:'#F8F0FF' },
    ];
}

/* ── Auto-init on load ────────────────────────────────────── */
GBdb.init();