function notFound(req, res) {
    res.status(404).json({ ok: false, error: `Route not found: ${req.originalUrl}` });
}

function onError(err, req, res, next) { // eslint-disable-line no-unused-vars
    // eslint-disable-next-line no-console
    console.error('[api:error]', err);
    const status = Number(err.statusCode || 500);
    res.status(status).json({
        ok: false,
        error: err.message || 'Internal server error.',
    });
}

module.exports = { notFound, onError };
