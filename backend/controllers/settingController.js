const Setting = require('../models/Setting');

function categoryToFolder(category = '') {
    const c = String(category || '').trim().toLowerCase();
    if (!c) return '';
    if (c.includes('chrome')) return 'chrome';
    if (c.includes('mirror')) return 'chrome';
    if (c.includes('animal')) return 'animal';
    if (c.includes('abstract')) return 'abstract';
    if (c.includes('swirl')) return 'swirls';
    if (c.includes('3d')) return '3d';
    if (c.includes('foil')) return 'foil';
    if (c.includes('season')) return 'seasonal';
    if (c.includes('floral')) return 'floral';
    if (c.includes('french')) return 'french';
    if (c.includes('gel')) return 'gel';
    if (c.includes('ombre')) return 'ombre';
    return c.replace(/[^a-z0-9]+/g, '');
}

function normalizeImagePath(rawImage = '', category = '') {
    let image = String(rawImage || '').trim();
    if (!image) return '';
    image = image.replace(/\\/g, '/');
    image = image.replace(/(\.(?:jpg|jpeg|png|webp|gif))\1+$/i, '$1');

    if (/^https?:\/\//i.test(image) || /^data:image\//i.test(image)) return image;

    if (/^\.\.\/images\//i.test(image)) return image;
    if (/^\/images\//i.test(image)) return `..${image}`;
    if (/^images\//i.test(image)) return `../${image}`;

    const docsMatch = image.match(/docs\/images\/gallery\/([^/]+)\/([^/?#]+)/i);
    if (docsMatch) {
        const folder = String(docsMatch[1] || '').toLowerCase();
        const file = String(docsMatch[2] || '').replace(/(\.(?:jpg|jpeg|png|webp|gif))\1+$/i, '$1');
        return `../images/gallery/${folder}/${file}`;
    }

    const galleryMatch = image.match(/gallery\/([^/]+)\/([^/?#]+)/i);
    if (galleryMatch) {
        const folder = String(galleryMatch[1] || '').toLowerCase();
        const file = String(galleryMatch[2] || '').replace(/(\.(?:jpg|jpeg|png|webp|gif))\1+$/i, '$1');
        return `../images/gallery/${folder}/${file}`;
    }

    const fileName = image.split('/').pop() || '';
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) {
        const folder = categoryToFolder(category);
        if (folder) return `../images/gallery/${folder}/${fileName}`;
    }
    return image;
}

function normalizeDesign(row = {}, fallbackId = 0) {
    const id = Number(row.id || fallbackId || 0) || fallbackId || 1;
    const category = String(row.category || '');
    return {
        id,
        name: String(row.name || `Design #${id}`),
        image: normalizeImagePath(row.image, category),
        category,
        complexity: String(row.complexity || ''),
        price: Number(row.price || 0),
        duration: Number(row.duration || 0),
        desc: String(row.desc || ''),
        tags: Array.isArray(row.tags) ? row.tags.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 12) : [],
        likes: Number(row.likes || 0),
        liked: !!row.liked,
    };
}

async function getAdminSettings(req, res) {
    const row = await Setting.findOne({ key: 'admin_settings' }).lean();
    return res.json({ ok: true, settings: row?.value || {} });
}

async function upsertAdminSettings(req, res) {
    const payload = {
        businessName: String(req.body.businessName || ''),
        supportEmail: String(req.body.supportEmail || ''),
        phone: String(req.body.phone || ''),
        address: String(req.body.address || ''),
        openHour: String(req.body.openHour || ''),
        closeHour: String(req.body.closeHour || ''),
        notes: String(req.body.notes || ''),
        updatedAt: new Date().toISOString(),
    };
    await Setting.findOneAndUpdate(
        { key: 'admin_settings' },
        { value: payload },
        { upsert: true, new: true }
    );
    return res.json({ ok: true, settings: payload });
}

async function getGalleryDesigns(req, res) {
    const row = await Setting.findOne({ key: 'gallery_designs' }).lean();
    const raw = Array.isArray(row?.value) ? row.value : [];
    const designs = raw.map((item, index) => normalizeDesign(item, index + 1));
    return res.json({ ok: true, designs });
}

async function upsertGalleryDesigns(req, res) {
    const source = Array.isArray(req.body?.designs) ? req.body.designs : [];
    const designs = source.map((item, index) => normalizeDesign(item, index + 1));
    await Setting.findOneAndUpdate(
        { key: 'gallery_designs' },
        { value: designs },
        { upsert: true, new: true }
    );
    return res.json({ ok: true, designs });
}

module.exports = {
    getAdminSettings,
    upsertAdminSettings,
    getGalleryDesigns,
    upsertGalleryDesigns,
};
