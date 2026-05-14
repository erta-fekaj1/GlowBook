async function getNextId(Model) {
    const latest = await Model.findOne({}, { id: 1 }).sort({ id: -1 }).lean();
    return (latest?.id || 0) + 1;
}

module.exports = { getNextId };
