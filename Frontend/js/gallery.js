'use strict';
/* ================================================================
   GLOWBOOK — gallery.js
   Handles all gallery logic:
   • Category definitions + color themes
   • Three views: grid / list / by-category
   • Search + filter pills
   • Like toggle (persisted)
   • Detail modal
   • Admin: add / edit / delete with image preview
   ================================================================ */

/* ── Category config ──────────────────────────────────────────── */
const CATEGORIES = [
    { key:'French',       label:'French',          icon:'fa-solid fa-star',              color:'#FFF7FB', accent:'#EC4899' },
    { key:'Gel',          label:'Gel',              icon:'fa-solid fa-droplet',           color:'#FCE7F3', accent:'#F472B6' },
    { key:'Ombre',        label:'Ombre',            icon:'fa-solid fa-circle-half-stroke', color:'#FFF7FB', accent:'#EC4899' },
    { key:'Floral',       label:'Floral',           icon:'fa-solid fa-leaf',              color:'#FFF7FB', accent:'#DB2777' },
    { key:'Glitter',      label:'Glitter',          icon:'fa-solid fa-sparkles',          color:'#FFF7FB', accent:'#EC4899' },
    { key:'Chrome',       label:'Chrome / Mirror',  icon:'fa-solid fa-circle',            color:'#FFF7FB', accent:'#4B5563' },
    { key:'Animal Print', label:'Animal Print',     icon:'fa-solid fa-paw',               color:'#FFF7FB', accent:'#BE185D' },
    { key:'Abstract',     label:'Abstract',         icon:'fa-solid fa-shapes',            color:'#FFF7FB', accent:'#BE185D' },
    { key:'Swirls',       label:'Swirls',           icon:'fa-solid fa-rotate',            color:'#FCE7F3', accent:'#BE185D' },
    { key:'3D',           label:'3D Nails',         icon:'fa-solid fa-cube',              color:'#FFF7FB', accent:'#BE185D' },
    { key:'Foil',         label:'Foil Nails',       icon:'fa-solid fa-wand-magic-sparkles',color:'#FFF7FB', accent:'#BE185D' },
    { key:'Seasonal',     label:'Seasonal',         icon:'fa-solid fa-snowflake',         color:'#FFF7FB', accent:'#BE185D' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

/* ── State ────────────────────────────────────────────────────── */
const state = {
    filter       : 'Të gjitha',
    view         : 'grid',          /* grid | list | category */
    editingId    : null,
    detailId     : null,
};
const BOOKING_PREFILL_KEY = 'gb_booking_prefill';

/* ── Helpers ──────────────────────────────────────────────────── */
const isAdmin = () => GB.isAdmin();

function getCat(key) {
    return CAT_MAP[key] || { color:'#FCE7F3', accent:'#F472B6', icon:'fa-solid fa-image' };
}

function complexityClass(c) {
    return c === 'E lehtë' ? 'gl-badge-easy' : c === 'Mesatare' ? 'gl-badge-med' : 'gl-badge-hard';
}

function suggestServiceForDesign(design) {
    const allServices = GB.services.getAll();
    const cat = String(design?.category || '').toLowerCase();
    const byKeyword = (keywords) =>
        allServices.find(s => keywords.some(k => String(s.name || '').toLowerCase().includes(k)));

    if (cat.includes('french')) return byKeyword(['french']);
    if (cat.includes('gel')) return byKeyword(['gel']);
    if (cat.includes('ombre')) return byKeyword(['ombre']);
    if (cat.includes('3d')) return byKeyword(['akryl', 'acryl', 'nail art']);
    if (cat.includes('chrome') || cat.includes('foil')) return byKeyword(['gel', 'nail art']);
    if (cat.includes('floral') || cat.includes('animal') || cat.includes('abstract') || cat.includes('swirls')) {
        return byKeyword(['nail art', 'gel']);
    }
    return byKeyword(['nail art', 'gel', 'manikyr']) || allServices[0] || null;
}

/* Fallback placeholder when image fails to load */
function imgError(img) {
    img.style.display = 'none';
    const ph = img.nextElementSibling;
    if (ph) ph.style.display = 'flex';
}
window.imgError = imgError;

/* ── Build filter pills ───────────────────────────────────────── */
function buildPills() {
    const container = document.getElementById('pillsContainer');
    if (!container) return;

    const all = [{ key:'Të gjitha', label:'Të gjitha', icon:'fa-solid fa-grip' }, ...CATEGORIES];
    container.innerHTML = all.map(c =>
        `<button class="gl-pill${state.filter === c.key ? ' active' : ''}"
            onclick="setFilter('${c.key}')" title="${c.label || c.key}">
            <i class="${c.icon || 'fa-solid fa-image'}"></i>
            <span>${c.label || c.key}</span>
        </button>`
    ).join('');
}

/* ── Filter + search logic ────────────────────────────────────── */
function getFiltered() {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    return GB.designs.getAll().filter(d => {
        const matchCat  = state.filter === 'Të gjitha' || d.category === state.filter;
        const matchSearch = !q ||
            d.name.toLowerCase().includes(q) ||
            (d.category || '').toLowerCase().includes(q) ||
            (d.desc || '').toLowerCase().includes(q) ||
            (d.tags || []).some(t => t.toLowerCase().includes(q));
        return matchCat && matchSearch;
    });
}

function setFilter(key) {
    state.filter = key;
    buildPills();
    render();
}

function applyFilters() {
    const q   = document.getElementById('searchInput')?.value || '';
    const clr = document.getElementById('searchClear');
    if (clr) clr.style.display = q ? 'flex' : 'none';
    render();
}
window.applyFilters = applyFilters;

function clearSearch() {
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    applyFilters();
}
window.clearSearch = clearSearch;

/* ── View toggle ──────────────────────────────────────────────── */
function setView(v) {
    state.view = v;
    ['grid','list','cats'].forEach(id => {
        document.getElementById('btn' + id.charAt(0).toUpperCase() + id.slice(1))
            ?.classList.toggle('active', v === id || (id === 'cats' && v === 'category'));
    });
    render();
}
window.setView = setView;

/* ── Stats ────────────────────────────────────────────────────── */
function updateStats(all) {
    const shown = getFiltered();
    document.getElementById('totalCount').textContent = all.length;
    document.getElementById('stTotal').textContent   = all.length;
    document.getElementById('stEasy').textContent    = all.filter(d => d.complexity === 'E lehtë').length;
    document.getElementById('stMed').textContent     = all.filter(d => d.complexity === 'Mesatare').length;
    document.getElementById('stHard').textContent    = all.filter(d => d.complexity === 'E vështirë').length;
    document.getElementById('stLikes').textContent   = all.reduce((s,d) => s + (d.likes||0), 0);

    const rc = document.getElementById('resultsCount');
    if (rc) {
        rc.textContent = shown.length === all.length
            ? `${all.length} dizajne`
            : `${shown.length} nga ${all.length} dizajne`;
    }
}

/* ================================================================
   CARD BUILDERS
   ================================================================ */

function buildGridCard(d) {
    const cat  = getCat(d.category);
    const comp = complexityClass(d.complexity);
    const adminBar = isAdmin() ? `
        <div class="gl-card-admin-bar" data-admin>
            <button class="gl-admin-btn gl-admin-edit"   onclick="event.stopPropagation();openEditModal(${d.id})">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="gl-admin-btn gl-admin-del"    onclick="event.stopPropagation();deleteDesign(${d.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>` : '';

    return `
    <div class="gl-card" onclick="openDetailModal(${d.id})" tabindex="0"
         onkeydown="if(event.key==='Enter')openDetailModal(${d.id})">
        <div class="gl-card-img-wrap" style="background:${cat.color}">
            <img src="${d.image || ''}" alt="${d.name}"
                 class="gl-card-img" onerror="imgError(this)" loading="lazy">
            <div class="gl-card-img-placeholder" style="display:none">
                <i class="${cat.icon}" style="color:${cat.accent}"></i>
                <span>${d.name}</span>
            </div>
            <div class="gl-card-overlay">
                <button class="gl-overlay-btn" onclick="event.stopPropagation();openDetailModal(${d.id})">
                    <i class="fa-solid fa-eye"></i> Shiko
                </button>
                <button class="gl-overlay-btn gl-overlay-book" onclick="event.stopPropagation();bookFromCard(${d.id})">
                    <i class="fa-solid fa-calendar-check"></i> Rezervo
                </button>
            </div>
            <button class="gl-like-btn ${d.liked ? 'liked' : ''}"
                onclick="event.stopPropagation();toggleLike(${d.id})" id="like-${d.id}"
                title="${d.liked ? 'Hiq pëlqimin' : 'Pëlqe'}">
                <i class="fa-${d.liked ? 'solid' : 'regular'} fa-heart"></i>
                <span>${d.likes || 0}</span>
            </button>
            <span class="gl-card-cat-badge" style="background:${cat.accent}">
                ${d.category}
            </span>
            ${adminBar}
        </div>
        <div class="gl-card-body">
            <div class="gl-card-title">${d.name}</div>
            <div class="gl-card-desc">${(d.desc||'').slice(0,65)}…</div>
            <div class="gl-card-footer">
                <span class="gl-complexity-badge ${comp}">${d.complexity}</span>
                <span class="gl-card-price">€${d.price}</span>
            </div>
            <div class="gl-card-meta">
                <span class="gl-card-dur"><i class="fa-regular fa-clock"></i> ${d.duration} min</span>
            </div>
            <button class="gl-card-book-inline" onclick="event.stopPropagation();bookFromCard(${d.id})">
                <i class="fa-solid fa-calendar-check"></i> Rezervo këtë stil
            </button>
        </div>
    </div>`;
}

function buildListRow(d) {
    const cat  = getCat(d.category);
    const comp = complexityClass(d.complexity);
    const adminCells = isAdmin() ? `
        <td>
            <div style="display:flex;gap:6px">
                <button class="btn-sm btn-edit"   onclick="openEditModal(${d.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-sm btn-delete" onclick="deleteDesign(${d.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>` : '';

    return `
    <tr class="gl-list-row" onclick="openDetailModal(${d.id})" style="cursor:pointer">
        <td>
            <div class="gl-list-img-cell">
                <div class="gl-list-thumb" style="background:${cat.color}">
                    <img src="${d.image||''}" alt="${d.name}" onerror="imgError(this)" loading="lazy">
                    <div class="gl-card-img-placeholder" style="display:none;font-size:1.2rem">
                        <i class="${cat.icon}" style="color:${cat.accent}"></i>
                    </div>
                </div>
                <div>
                    <div class="gl-list-name">${d.name}</div>
                    <div class="gl-list-tags">
                        ${(d.tags||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        </td>
        <td><span class="gl-card-cat-pill" style="background:${cat.color};color:${cat.accent}">${d.category}</span></td>
        <td><span class="gl-complexity-badge ${comp}">${d.complexity}</span></td>
        <td style="font-weight:600;color:var(--pink)">€${d.price}</td>
        <td style="color:var(--text-subtle)">${d.duration} min</td>
        <td>
            <button class="btn-sm btn-edit" style="background:var(--pink-light);color:var(--pink-deep)" onclick="event.stopPropagation();bookFromCard(${d.id})">
                <i class="fa-solid fa-calendar-check"></i> Rezervo
            </button>
        </td>
        <td>
            <button class="gl-like-btn ${d.liked?'liked':''}" style="position:static;transform:none;box-shadow:none;background:var(--pink-light);border-radius:20px;padding:4px 10px;font-size:.78rem"
                onclick="event.stopPropagation();toggleLike(${d.id})" id="like-${d.id}">
                <i class="fa-${d.liked?'solid':'regular'} fa-heart" style="color:var(--pink)"></i>
                <span>${d.likes||0}</span>
            </button>
        </td>
        ${adminCells}
    </tr>`;
}

/* ================================================================
   RENDER ENGINE
   ================================================================ */
function render() {
    const all      = GB.designs.getAll();
    const filtered = getFiltered();
    updateStats(all);

    const container = document.getElementById('galleryContainer');
    if (!container) return;

    if (!filtered.length) {
        container.innerHTML = `
            <div class="gl-empty">
                <div class="gl-empty-icon"><i class="fa-solid fa-image"></i></div>
                <h3>Nuk u gjetën dizajne</h3>
                <p>Provoni një filtrim tjetër ose pastroni kërkimin.</p>
                <button class="btn-secondary" onclick="setFilter('Të gjitha');clearSearch()">
                    <i class="fa-solid fa-rotate-left"></i> Shiko të gjitha
                </button>
            </div>`;
        return;
    }

    /* ── GRID view ── */
    if (state.view === 'grid') {
        container.innerHTML = `<div class="gl-grid">${filtered.map(buildGridCard).join('')}</div>`;
        return;
    }

    /* ── LIST view ── */
    if (state.view === 'list') {
        const adminHeader = isAdmin() ? '<th>Veprime</th>' : '';
        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead><tr>
                        <th>Dizajni</th>
                        <th>Kategoria</th>
                        <th>Vështirësia</th>
                        <th>Çmimi</th>
                        <th>Kohëzgjatja</th>
                        <th>Rezervo</th>
                        <th>Pëlqimet</th>
                        ${adminHeader}
                    </tr></thead>
                    <tbody>${filtered.map(buildListRow).join('')}</tbody>
                </table>
            </div>`;
        return;
    }

    /* ── CATEGORY view ── */
    if (state.view === 'category') {
        const byCat = {};
        filtered.forEach(d => {
            if (!byCat[d.category]) byCat[d.category] = [];
            byCat[d.category].push(d);
        });

        const sections = CATEGORIES
            .filter(c => byCat[c.key]?.length)
            .map(c => {
                const designs = byCat[c.key];
                return `
                <section class="gl-cat-section">
                    <div class="gl-cat-header" style="border-left:4px solid ${c.accent}">
                        <div class="gl-cat-icon" style="background:${c.color};color:${c.accent}">
                            <i class="${c.icon}"></i>
                        </div>
                        <div class="gl-cat-info">
                            <h2 class="gl-cat-title">${c.label}</h2>
                            <span class="gl-cat-count">${designs.length} dizajne</span>
                        </div>
                        <button class="btn-secondary gl-cat-see-all"
                            onclick="setFilter('${c.key}');setView('grid')">
                            Shiko të gjitha <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                    <div class="gl-grid gl-cat-grid">
                        ${designs.slice(0, 4).map(buildGridCard).join('')}
                    </div>
                </section>`;
            }).join('');

        container.innerHTML = sections ||
            `<div class="gl-empty"><p>Nuk ka dizajne për këtë kërkesë.</p></div>`;
        return;
    }
}

/* ================================================================
   LIKE
   ================================================================ */
function toggleLike(id) {
    const all = GB.designs.getAll();
    const d   = all.find(x => x.id === id);
    if (!d) return;
    d.liked  = !d.liked;
    d.likes  = (d.likes || 0) + (d.liked ? 1 : -1);
    GB.designs.save(all);

    /* Update button in place without full re-render */
    const btn = document.getElementById(`like-${id}`);
    if (btn) {
        btn.className = `gl-like-btn ${d.liked ? 'liked' : ''}`;
        btn.innerHTML = `<i class="fa-${d.liked?'solid':'regular'} fa-heart"></i><span>${d.likes}</span>`;
    }

    /* Update stat */
    const total = all.reduce((s,x) => s+(x.likes||0), 0);
    const el = document.getElementById('stLikes');
    if (el) el.textContent = total;

    /* Sync detail modal if open */
    if (state.detailId === id) {
        const icon  = document.getElementById('detailLikeIcon');
        const count = document.getElementById('detailLikeCount');
        const dbtn  = document.getElementById('detailLikeBtn');
        if (icon)  icon.className  = `fa-${d.liked?'solid':'regular'} fa-heart`;
        if (count) count.textContent = d.likes;
        if (dbtn)  dbtn.classList.toggle('liked', d.liked);
    }
}
window.toggleLike = toggleLike;

function toggleLikeFromModal() {
    if (state.detailId) toggleLike(state.detailId);
}
window.toggleLikeFromModal = toggleLikeFromModal;

/* ================================================================
   DETAIL MODAL
   ================================================================ */
function openDetailModal(id) {
    const d = GB.designs.getAll().find(x => x.id === id);
    if (!d) return;
    state.detailId = id;
    const cat = getCat(d.category);

    /* Image */
    const img = document.getElementById('detailImg');
    const ph  = document.getElementById('detailPlaceholder');
    img.src   = d.image || '';
    img.alt   = d.name;
    img.style.display = '';
    if (ph) {
        ph.style.display = 'none';
        ph.innerHTML = `<i class="${cat.icon}" style="font-size:3rem;color:${cat.accent}"></i><span>${d.name}</span>`;
    }
    img.onerror = () => { img.style.display='none'; if(ph) ph.style.display='flex'; };

    /* Content */
    document.getElementById('detailCat').textContent     = d.category;
    document.getElementById('detailCat').style.color     = cat.accent;
    document.getElementById('detailCat').style.background= cat.color;
    document.getElementById('detailName').textContent    = d.name;
    document.getElementById('detailPrice').textContent   = `€${d.price}`;
    document.getElementById('detailDur').textContent     = `${d.duration} minuta`;
    document.getElementById('detailDesc').textContent    = d.desc || '';

    /* Tags */
    document.getElementById('detailTags').innerHTML = (d.tags||[])
        .map(t=>`<span class="tag">${t}</span>`).join('');

    /* Complexity */
    const comp = document.getElementById('detailComp');
    comp.textContent = d.complexity;
    comp.className   = `gl-complexity-badge ${complexityClass(d.complexity)}`;

    /* Like */
    const likeBtn  = document.getElementById('detailLikeBtn');
    const likeIcon = document.getElementById('detailLikeIcon');
    const likeCount= document.getElementById('detailLikeCount');
    likeBtn?.classList.toggle('liked', !!d.liked);
    if (likeIcon)  likeIcon.className  = `fa-${d.liked?'solid':'regular'} fa-heart`;
    if (likeCount) likeCount.textContent = d.likes || 0;

    document.getElementById('detailOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
window.openDetailModal = openDetailModal;

function closeDetailModal() {
    document.getElementById('detailOverlay').classList.remove('open');
    document.body.style.overflow = '';
    state.detailId = null;
}
window.closeDetailModal = closeDetailModal;

function bookDesign() {
    if (!state.detailId) return;
    startBookingTransition(state.detailId, true);
}
window.bookDesign = bookDesign;

function bookFromCard(id) {
    startBookingTransition(id, false);
}
window.bookFromCard = bookFromCard;

function startBookingTransition(id, closeModalFirst) {
    const design = GB.designs.getAll().find(x => x.id === id);
    if (!design) return;

    const suggestedService = suggestServiceForDesign(design);
    localStorage.setItem(BOOKING_PREFILL_KEY, JSON.stringify({
        designId: design.id,
        designName: design.name,
        designImage: design.image || '',
        designCategory: design.category || '',
        designPrice: Number(design.price || 0),
        designDuration: Number(design.duration || 0),
        suggestedServiceId: suggestedService?.id || null,
        suggestedServiceName: suggestedService?.name || null,
        createdAt: new Date().toISOString(),
    }));

    if (closeModalFirst) closeDetailModal();
    window.location.href = 'booking.html?source=gallery';
}

/* ================================================================
   ADMIN: ADD / EDIT / DELETE
   ================================================================ */
function openAddModal() {
    state.editingId = null;
    document.getElementById('addModalTitle').textContent    = 'Shto Dizajn të Ri';
    document.getElementById('addModalSaveBtn').innerHTML    = '<i class="fa-solid fa-floppy-disk"></i> Shto Dizajnin';
    ['dName','dImage','dPrice','dDur','dDesc','dTags'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('dCat').value  = 'French';
    document.getElementById('dComp').value = 'E lehtë';
    resetAdminImgPreview();
    document.getElementById('addModal').classList.add('open');
}
window.openAddModal = openAddModal;

function openEditModal(id) {
    const d = GB.designs.getAll().find(x => x.id === id);
    if (!d) return;
    state.editingId = id;
    document.getElementById('addModalTitle').textContent  = 'Edito Dizajnin';
    document.getElementById('addModalSaveBtn').innerHTML  = '<i class="fa-solid fa-floppy-disk"></i> Ruaj Ndryshimet';
    document.getElementById('dName').value  = d.name;
    document.getElementById('dImage').value = d.image || '';
    document.getElementById('dCat').value   = d.category;
    document.getElementById('dComp').value  = d.complexity;
    document.getElementById('dPrice').value = d.price;
    document.getElementById('dDur').value   = d.duration;
    document.getElementById('dDesc').value  = d.desc || '';
    document.getElementById('dTags').value  = (d.tags||[]).join(', ');
    previewAdminImg();
    document.getElementById('addModal').classList.add('open');
}
window.openEditModal = openEditModal;

function closeAddModal() {
    document.getElementById('addModal').classList.remove('open');
    state.editingId = null;
    resetAdminImgPreview();
}
window.closeAddModal = closeAddModal;

function previewAdminImg() {
    const src = document.getElementById('dImage')?.value?.trim();
    const img  = document.getElementById('adminImgPreview');
    const ph   = document.getElementById('adminImgPlaceholder');
    if (!src) { resetAdminImgPreview(); return; }
    img.src            = src;
    img.style.display  = '';
    if (ph) ph.style.display = 'none';
    img.onerror = () => { img.style.display='none'; if(ph) ph.style.display='flex'; };
}
window.previewAdminImg = previewAdminImg;

function resetAdminImgPreview() {
    const img = document.getElementById('adminImgPreview');
    const ph  = document.getElementById('adminImgPlaceholder');
    if (img) { img.src=''; img.style.display='none'; }
    if (ph)  ph.style.display = 'flex';
}

function saveDesign() {
    const name  = document.getElementById('dName')?.value.trim();
    const image = document.getElementById('dImage')?.value.trim();
    const cat   = document.getElementById('dCat')?.value;
    const comp  = document.getElementById('dComp')?.value;
    const price = parseFloat(document.getElementById('dPrice')?.value) || 0;
    const dur   = parseInt(document.getElementById('dDur')?.value)    || 30;
    const desc  = document.getElementById('dDesc')?.value.trim();
    const tags  = (document.getElementById('dTags')?.value || '')
        .split(',').map(t=>t.trim()).filter(Boolean);

    if (!name) { GB.toast('Shkruani emrin e dizajnit!', 'error'); return; }
    if (!image){ GB.toast('Shkruani shtëgun e imazhit!', 'error'); return; }

    if (state.editingId) {
        GB.designs.update(state.editingId, { name, image, category:cat, complexity:comp, price, duration:dur, desc, tags });
        GB.toast(`"${name}" u përditësua!`, 'success');
    } else {
        GB.designs.add({ name, image, category:cat, complexity:comp, price, duration:dur, desc, tags });
        GB.toast(`"${name}" u shtua!`, 'success');
    }
    closeAddModal();
    render();
}
window.saveDesign = saveDesign;

function deleteDesign(id) {
    const d = GB.designs.getAll().find(x => x.id === id);
    if (!d) return;
    if (!confirm(`A jeni të sigurt që dëshironi të fshini "${d.name}"?`)) return;
    GB.designs.delete(id);
    GB.toast('Dizajni u fshi!', 'success');
    render();
}
window.deleteDesign = deleteDesign;

/* ================================================================
   EVENT LISTENERS
   ================================================================ */
document.getElementById('detailOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('detailOverlay')) closeDetailModal();
});
document.getElementById('addModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('addModal')) closeAddModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDetailModal(); closeAddModal(); }
});

/* ================================================================
   INIT
   ================================================================ */
(function init() {
    GB.init({ page: 'gallery' });
    buildPills();
    render();
    /* Hide search clear button initially */
    const clr = document.getElementById('searchClear');
    if (clr) clr.style.display = 'none';
})();