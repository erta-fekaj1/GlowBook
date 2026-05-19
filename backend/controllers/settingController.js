const Setting = require('../models/Setting');

function normalizeDesign(row = {}, fallbackId = 0) {
    const id = Number(row.id || fallbackId || 0) || fallbackId || 1;
    return {
        id,
        name: String(row.name || `Design #${id}`),
        image: String(row.image || ''),
        category: String(row.category || ''),
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
