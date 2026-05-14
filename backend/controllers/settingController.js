const Setting = require('../models/Setting');

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

module.exports = { getAdminSettings, upsertAdminSettings };
