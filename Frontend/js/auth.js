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
const _WORKDAY_SLOTS = Array.from({ length: 9 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`);

function _slotKey(value) {
    const m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
    return m ? `${m[1]}T${m[2]}:${m[3]}` : '';
}
function _dayKey(value) {
    const m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
}
function _isActiveAppointment(a) {
    return (a?.status || '').toLowerCase() !== 'cancelled';
}

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

    /* ── Default gallery designs (full dataset — all categories) ── */
    if (!_r(_K.DESIGNS)) {
        _w(_K.DESIGNS, [
            /* ── French ── */
            { id:1,  name:'French Classic',     image:'../images/gallery/french/french1.jpg',    category:'French',  complexity:'E lehtë',    price:15, duration:30,  desc:'Dizajni klasik francez me majë të bardhë elegante. Perfekt për çdo rast.',         tags:['Klasik','Elegant','Casual'],   likes:24, liked:false },
            { id:2,  name:'Gold French Tips',   image:'../images/gallery/french/french2.jpg',    category:'French',  complexity:'Mesatare',   price:28, duration:50,  desc:'Majë të arta luksoze mbi bazë transparente. Sofistikate dhe moderne.',            tags:['Gold','Luks','French'],        likes:41, liked:false },
            { id:3,  name:'Pink French',        image:'../images/gallery/french/french3.jpg',    category:'French',  complexity:'E lehtë',    price:18, duration:35,  desc:'Varianti rozë i French klasikut. Femëror dhe i ëmbël.',                           tags:['Pink','French','Sweet'],       likes:33, liked:false },

            /* ── Gel ── */
            { id:4,  name:'Gel Nude',           image:'../images/gallery/gel/gel1.jpg',          category:'Gel',     complexity:'E lehtë',    price:18, duration:35,  desc:'Ngjyrë neutrale dhe naturale. I shkon çdo veshje dhe rast.',                      tags:['Neutral','Natural','Gel'],     likes:29, liked:false },
            { id:5,  name:'Red Glam Gel',       image:'../images/gallery/gel/gel2.jpg',          category:'Gel',     complexity:'E lehtë',    price:16, duration:30,  desc:'Ngjyrë e kuqe klasike dhe e pasur. Ikonike dhe e fuqishme.',                       tags:['Klasik','Bold','Red'],         likes:33, liked:false },
            { id:6,  name:'Marble Gel',         image:'../images/gallery/gel/gel3.jpg',          category:'Gel',     complexity:'E vështirë', price:38, duration:80,  desc:'Efekt mermer luksoz me vija delikate gri dhe të bardhë.',                         tags:['Luks','Marble','Modern'],      likes:37, liked:false },
            { id:7,  name:'Lavender Gel',       image:'../images/gallery/gel/gel4.jpg',          category:'Gel',     complexity:'E lehtë',    price:17, duration:30,  desc:'Ngjyrë lavanderi e butë dhe qetësuese. Perfekte për pranverën.',                  tags:['Pastel','Purple','Spring'],    likes:35, liked:false },

            /* ── Ombre ── */
            { id:8,  name:'Pink Ombre',         image:'../images/gallery/ombre/ombre1.jpg',      category:'Ombre',   complexity:'Mesatare',   price:25, duration:45,  desc:'Kalim gradual nga rozë i çelët te ngjyra më e thellë. Romantike dhe femërore.',   tags:['Romantike','Ombre','Pink'],   likes:31, liked:false },
            { id:9,  name:'Baby Blue Ombre',    image:'../images/gallery/ombre/ombre2.jpg',      category:'Ombre',   complexity:'Mesatare',   price:22, duration:45,  desc:'Kalim i butë në ngjyrë blu të çelët. Freskues dhe i ëmbël.',                      tags:['Pastel','Blue','Sweet'],       likes:27, liked:false },
            { id:10, name:'Sunset Ombre',       image:'../images/gallery/ombre/ombre3.jpg',      category:'Ombre',   complexity:'E vështirë', price:32, duration:70,  desc:'Kalim i bukur nga portokalli në rozë si perëndim dielli. Dramatik dhe ngjyrshëm.',tags:['Sunset','Warm','Dramatic'],    likes:45, liked:false },

            /* ── Floral ── */
            { id:11, name:'Floral Dream',       image:'../images/gallery/floral/floral1.jpg',    category:'Floral',  complexity:'E vështirë', price:40, duration:90,  desc:'Lule të vogla të vizatuara me dorë. Punë artizanale e lartë dhe delikate.',      tags:['Art','Lule','Handmade'],      likes:45, liked:false },
            { id:12, name:'Floral Ombre',       image:'../images/gallery/floral/floral2.jpg',    category:'Floral',  complexity:'E vështirë', price:50, duration:120, desc:'Kombinim elegant i ombre me lule të vizatuara. Dizajni trending i sezonit.',      tags:['Trending','Lule','Ombre'],    likes:61, liked:false },
            { id:13, name:'Daisy Nails',        image:'../images/gallery/floral/floral3.jpg',    category:'Floral',  complexity:'Mesatare',   price:30, duration:60,  desc:'Lule kamomili të bardha dhe të verdha mbi bazë të çelët. Fresket dhe verore.',   tags:['Daisy','Summer','Fresh'],     likes:38, liked:false },

            /* ── Glitter ── */
            { id:14, name:'Glitter Bomb',       image:'../images/gallery/glitter/glitter1.jpg',  category:'Glitter', complexity:'E lehtë',    price:20, duration:40,  desc:'Shkëlqim dhe glamour në çdo gisht. Ideal për festa dhe ngjarje speciale.',        tags:['Festë','Glamour','Shine'],    likes:18, liked:false },
            { id:15, name:'Galaxy Nails',       image:'../images/gallery/glitter/glitter2.jpg',  category:'Glitter', complexity:'E vështirë', price:45, duration:100, desc:'Efekt galaktik me ngjyra të errëta dhe shkëlqim si yje. Unike dhe mbresëlënëse.',tags:['Galaxy','Artsy','Unique'],    likes:52, liked:false },
            { id:16, name:'Rose Gold Glitter',  image:'../images/gallery/glitter/glitter3.jpg',  category:'Glitter', complexity:'Mesatare',   price:28, duration:55,  desc:'Shkëlqim rozë ari mbi bazë krem. Femëror, luksoze dhe elegant.',                 tags:['RoseGold','Luks','Glamour'],  likes:44, liked:false },

            /* ── Chrome / Mirror ── */
            { id:17, name:'Silver Chrome',      image:'../images/gallery/chrome/chrome1.jpg',    category:'Chrome',  complexity:'Mesatare',   price:32, duration:55,  desc:'Efekt metalik argjendi perfekt sikur pasqyrë. Futuristik dhe mbresëlënës.',       tags:['Silver','Mirror','Metal'],    likes:56, liked:false },
            { id:18, name:'Gold Mirror',        image:'../images/gallery/chrome/chrome2.jpg',    category:'Chrome',  complexity:'Mesatare',   price:35, duration:60,  desc:'Shkëlqim ar i pastër si pasqyrë. Luksoze dhe glamoroz.',                          tags:['Gold','Mirror','Luks'],       likes:49, liked:false },
            { id:19, name:'Rose Gold Chrome',   image:'../images/gallery/chrome/chrome3.jpg',    category:'Chrome',  complexity:'Mesatare',   price:33, duration:55,  desc:'Efekt pasqyre rozë ari. Kombinim perfekt i modernitetit me femëroren.',           tags:['RoseGold','Chrome','Trendy'], likes:62, liked:false },
            { id:20, name:'Blue Chrome',        image:'../images/gallery/chrome/chrome4.jpg',    category:'Chrome',  complexity:'E vështirë', price:38, duration:65,  desc:'Pasqyrë blu elektrik që ndryshon ngjyrë sipas dritës. Magjike dhe dinamike.',    tags:['Blue','Mirror','Iridescent'], likes:41, liked:false },

            /* ── Animal Print ── */
            { id:21, name:'Leopard Print',      image:'../images/gallery/animal/animal1.jpg',    category:'Animal Print', complexity:'E vështirë', price:40, duration:85,  desc:'Modeli leopard i vizatuar me dorë. Bold, guximtar dhe trendy gjithmonë.',     tags:['Leopard','Wild','Bold'],      likes:47, liked:false },
            { id:22, name:'Zebra Stripes',      image:'../images/gallery/animal/animal2.jpg',    category:'Animal Print', complexity:'Mesatare',   price:30, duration:65,  desc:'Vija zebër të bardha e të zeza. Klasike, kontraste dhe mbresëlënëse.',        tags:['Zebra','Stripes','Classic'],  likes:35, liked:false },
            { id:23, name:'Snake Skin',         image:'../images/gallery/animal/animal3.jpg',    category:'Animal Print', complexity:'E vështirë', price:45, duration:95,  desc:'Teksturë lëkure gjarpri e vizatuar me durim dhe precizion të lartë.',         tags:['Snake','Texture','Art'],      likes:38, liked:false },
            { id:24, name:'Cow Print',          image:'../images/gallery/animal/animal4.jpg',    category:'Animal Print', complexity:'Mesatare',   price:28, duration:60,  desc:'Modeli lopë retro dhe i lezetshëm. Trendy dhe argëtues për verën.',            tags:['Cow','Retro','Fun'],          likes:52, liked:false },

            /* ── Abstract ── */
            { id:25, name:'Abstract Lines',     image:'../images/gallery/abstract/abstract1.jpg',category:'Abstract', complexity:'Mesatare',   price:28, duration:55,  desc:'Vija dhe forma gjeometrike abstrakte. Moderne, minimalist dhe artistike.',       tags:['Lines','Modern','Art'],       likes:39, liked:false },
            { id:26, name:'Color Block',        image:'../images/gallery/abstract/abstract2.jpg',category:'Abstract', complexity:'E lehtë',    price:22, duration:45,  desc:'Blloke ngjyrash kontraste. Thjeshtë, bold dhe tepër modern.',                    tags:['Colorful','Block','Minimal'], likes:31, liked:false },
            { id:27, name:'Paint Splash',       image:'../images/gallery/abstract/abstract3.jpg',category:'Abstract', complexity:'E vështirë', price:42, duration:90,  desc:'Spërkatje ngjyrash si pikturë artistike. Unike — çdo thonj ndryshon!',          tags:['Art','Splash','Unique'],      likes:54, liked:false },
            { id:28, name:'Negative Space',     image:'../images/gallery/abstract/abstract4.jpg',category:'Abstract', complexity:'Mesatare',   price:30, duration:60,  desc:'Hapësirat negative si dizajn vetë. Minimalist, elegant dhe tepër trendy.',      tags:['Minimal','Space','Trendy'],   likes:43, liked:false },

            /* ── Swirls ── */
            { id:29, name:'Pastel Swirls',      image:'../images/gallery/swirls/swirls1.jpg',    category:'Swirls',  complexity:'E vështirë', price:38, duration:80,  desc:'Spirale delikate pastel në ngjyra të buta dhe ëmbëlsuese. Romantike dhe unike.', tags:['Pastel','Swirl','Romantic'],  likes:57, liked:false },
            { id:30, name:'Black & White Swirl',image:'../images/gallery/swirls/swirls2.jpg',    category:'Swirls',  complexity:'E vështirë', price:35, duration:75,  desc:'Spirale kontraste bardhë e zi. Dramatike, sofistikate dhe moderne.',            tags:['BW','Contrast','Modern'],     likes:44, liked:false },
            { id:31, name:'Rainbow Swirls',     image:'../images/gallery/swirls/swirls3.jpg',    category:'Swirls',  complexity:'E vështirë', price:45, duration:100, desc:'Spirale shumëngjyrëshe si ylber. Gëzuese, ngjyrshëme dhe plot energji.',        tags:['Rainbow','Fun','Colorful'],   likes:63, liked:false },

            /* ── 3D Nails ── */
            { id:32, name:'3D Roses',           image:'../images/gallery/3d/3d1.jpg',            category:'3D',      complexity:'E vështirë', price:60, duration:120, desc:'Trëndafila 3D të formuara me akryl mbi thonj. Tepër luksoz dhe vëmendtërheqës.', tags:['Roses','3D','Luxury'],        likes:71, liked:false },
            { id:33, name:'3D Pearls',          image:'../images/gallery/3d/3d2.jpg',            category:'3D',      complexity:'E vështirë', price:55, duration:110, desc:'Perla dhe kristale 3D të ngjitura me kujdes. Elegant, luksoze dhe festiv.',      tags:['Pearls','Crystal','Elegant'], likes:65, liked:false },
            { id:34, name:'3D Bow Nails',       image:'../images/gallery/3d/3d3.jpg',            category:'3D',      complexity:'Mesatare',   price:45, duration:90,  desc:'Hinkëza të bëra me akryl mbi thonj. Femëror, i ëmbël dhe tepër kawaii.',        tags:['Bow','Cute','Kawaii'],        likes:58, liked:false },
            { id:35, name:'3D Butterflies',     image:'../images/gallery/3d/3d4.jpg',            category:'3D',      complexity:'E vështirë', price:65, duration:130, desc:'Flutura 3D të buta dhe delikate. Magji e vërtetë e artit të thonjve.',           tags:['Butterfly','3D','Magic'],     likes:82, liked:false },

            /* ── Foil Nails ── */
            { id:36, name:'Gold Foil',          image:'../images/gallery/foil/foil1.jpg',        category:'Foil',    complexity:'E lehtë',    price:22, duration:40,  desc:'Folia ari e aplikuar mbi bazë transparente ose ngjyrë. Luksoze dhe e shpejtë.',  tags:['Gold','Foil','Quick'],        likes:48, liked:false },
            { id:37, name:'Holographic Foil',   image:'../images/gallery/foil/foil2.jpg',        category:'Foil',    complexity:'Mesatare',   price:30, duration:55,  desc:'Folia holografike që ndryshon ngjyrë. Magjike, iridescente dhe moderne.',        tags:['Holo','Iridescent','Magic'],  likes:67, liked:false },
            { id:38, name:'Silver Foil Tips',   image:'../images/gallery/foil/foil3.jpg',        category:'Foil',    complexity:'E lehtë',    price:25, duration:45,  desc:'Majët e thonjve të mbuluara me foli argjendi. Variant modern i French tipik.',  tags:['Silver','Tips','Modern'],     likes:39, liked:false },
            { id:39, name:'Rainbow Foil',       image:'../images/gallery/foil/foil4.jpg',        category:'Foil',    complexity:'Mesatare',   price:32, duration:60,  desc:'Folia shumëngjyrëshe si ylber. Tërheq vëmendjen gjithkund ku shkoni.',          tags:['Rainbow','Foil','Bold'],      likes:55, liked:false },

            /* ── Seasonal ── */
            { id:40, name:'Valentine Hearts',   image:'../images/gallery/seasonal/seasonal1.jpg',category:'Seasonal',complexity:'Mesatare',   price:25, duration:50,  desc:'Zemra rozë dhe të kuqe për Shën Valentin. Romantike dhe të ëmbla.',             tags:['Valentine','Hearts','Love'],  likes:44, liked:false },
            { id:41, name:'Summer Vibes',       image:'../images/gallery/seasonal/seasonal2.jpg',category:'Seasonal',complexity:'E lehtë',    price:20, duration:40,  desc:'Ngjyra verore të ndezura dhe motive diellore. Energji dhe lumturi.',             tags:['Summer','Sun','Bright'],      likes:51, liked:false },
            { id:42, name:'Autumn Leaves',      image:'../images/gallery/seasonal/seasonal3.jpg',category:'Seasonal',complexity:'Mesatare',   price:28, duration:60,  desc:'Gjethet e vjeshtës në ari, portokalli dhe kafe. Ngrohtësi dhe charm.',          tags:['Autumn','Warm','Nature'],     likes:36, liked:false },
            { id:43, name:'Winter Wonderland',  image:'../images/gallery/seasonal/seasonal4.jpg',category:'Seasonal',complexity:'E vështirë', price:35, duration:75,  desc:'Thekon bore dhe sfond dimëror. Magjia e dimrit në majat e gishtave.',            tags:['Winter','Snow','Magic'],      likes:49, liked:false },
            { id:44, name:'Christmas Nails',    image:'../images/gallery/seasonal/seasonal5.jpg',category:'Seasonal',complexity:'Mesatare',   price:30, duration:65,  desc:'Motive krishtlindjore me thekon, drurë dhe ngjyra festive.',                     tags:['Christmas','Holiday','Red'],  likes:67, liked:false },
            { id:45, name:'Spring Blossom',     image:'../images/gallery/seasonal/seasonal6.jpg',category:'Seasonal',complexity:'Mesatare',   price:26, duration:55,  desc:'Lule pranverore të buta dhe ngjyra të freskëta pastel.',                         tags:['Spring','Floral','Fresh'],    likes:42, liked:false },
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
        getBookedSlotsByDate(dateISO) {
            const day = _dayKey(dateISO);
            if (!day) return [];
            return this.getAll()
                .filter(a => _isActiveAppointment(a) && _dayKey(a.date) === day)
                .map(a => _slotKey(a.date).split('T')[1])
                .filter(Boolean);
        },
        isSlotTaken(dateISO, excludeId = null) {
            const target = _slotKey(dateISO);
            if (!target) return false;
            return this.getAll().some(a =>
                a.id !== excludeId &&
                _isActiveAppointment(a) &&
                _slotKey(a.date) === target
            );
        },
        getDayAvailability(dateISO, slots = _WORKDAY_SLOTS) {
            const booked = new Set(this.getBookedSlotsByDate(dateISO));
            return {
                slots,
                bookedCount: booked.size,
                freeCount: Math.max(0, slots.length - booked.size),
                isFull: booked.size >= slots.length,
                bookedSlots: [...booked],
            };
        },

        add({ userEmail, userName, serviceId, serviceName, date, notes='', status='Pending' }) {
            if (!userEmail || !serviceId || !date) {
                return { ok:false, error:'Email, shërbimi dhe data janë të detyrueshme.' };
            }
            if (this.isSlotTaken(date)) {
                return { ok:false, error:'Ky orar është i rezervuar. Ju lutem zgjidhni një orar tjetër.' };
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
            const updated = { ...all[idx], ...fields };
            if (_isActiveAppointment(updated) && this.isSlotTaken(updated.date, id)) {
                return { ok:false, error:'Ky orar është i rezervuar. Ju lutem zgjidhni një orar tjetër.' };
            }
            all[idx] = updated;
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
        const homeHref = this.isAdmin() ? 'dashboard.html' : 'booking.html';

        const li = (page, href, icon, label) =>
            `<a class="nav-item${active===page?' active':''}" href="${href}">
                <i class="${icon} nav-icon"></i> ${label}
             </a>`;

        const adminLinks = this.isAdmin() ? `
            ${li('admin',   'admin.html',   'fa-solid fa-shield-halved', 'Admin Panel')}
            ${li('users',   'users.html',   'fa-solid fa-users',         'Përdoruesit')}
        ` : '';
        const bookingLink = this.isAdmin()
            ? ''
            : li('booking', 'booking.html', 'fa-solid fa-calendar-plus', 'Prenoto Takim');

        sb.innerHTML = `
            <div class="logo">
                <a href="${homeHref}" class="logo-img-link">
                    <img src="../images/logo.png" alt="Glow Book Logo" class="logo-img"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                    <span class="logo-img-fallback">💅</span>
                </a>
                <h2>Glow Book</h2>
                <p>Nail Salon</p>
            </div>
            ${adminLinks}
            ${bookingLink}
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