function notFound(req, res) {
    res.status(404).json({ ok: false, error: `Route not found: ${req.originalUrl}` });
}

function onError(err, req, res, next) { // eslint-disable-line no-unused-vars
    // eslint-disable-next-line no-console
    console.error('[api:error]', err);
    let status = Number(err.statusCode || 500);
    if (err.code === 'LIMIT_FILE_SIZE') {
        status = 400;
    }
    res.status(status).json({
        ok: false,
        error: err.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded image is too large.'
            : (err.message || 'Internal server error.'),
    });
}

module.exports = { notFound, onError };
