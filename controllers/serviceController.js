const Service = require('../models/Service');
const { getNextId } = require('../utils/id');
const { serializeService } = require('../utils/serializers');

async function listServices(req, res) {
    const query = req.user?.role === 'admin' ? {} : { isActive: true };
    const services = await Service.find(query).sort({ name: 1 });
    return res.json({ ok: true, services: services.map(serializeService) });
}

async function createService(req, res) {
    const id = await getNextId(Service);
    const service = await Service.create({
        id,
        name: String(req.body.name).trim(),
        desc: String(req.body.desc || '').trim(),
        price: Number(req.body.price || 0),
        duration: Number(req.body.duration || 60),
        isActive: req.body.isActive !== false,
    });
    return res.status(201).json({ ok: true, service: serializeService(service) });
}

async function updateService(req, res) {
    const service = await Service.findOne({ id: Number(req.params.id) });
    if (!service) return res.status(404).json({ ok: false, error: 'Service not found.' });
    if (typeof req.body.name === 'string') service.name = req.body.name.trim();
    if (typeof req.body.desc === 'string') service.desc = req.body.desc.trim();
    if (typeof req.body.price !== 'undefined') service.price = Number(req.body.price || 0);
    if (typeof req.body.duration !== 'undefined') service.duration = Number(req.body.duration || 60);
    if (typeof req.body.isActive !== 'undefined') service.isActive = !!req.body.isActive;
    await service.save();
    return res.json({ ok: true, service: serializeService(service) });
}

async function removeService(req, res) {
    const deleted = await Service.findOneAndDelete({ id: Number(req.params.id) });
    if (!deleted) return res.status(404).json({ ok: false, error: 'Service not found.' });
    return res.json({ ok: true });
}

module.exports = { listServices, createService, updateService, removeService };
