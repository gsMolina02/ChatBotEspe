const { rateLimit } = require('express-rate-limit');

const createMessage = error => ({ success: false, error });

const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: createMessage('Demasiadas solicitudes. Intenta nuevamente en un minuto.')
});

const pageLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: createMessage('Demasiadas consultas. Intenta nuevamente en un minuto.')
});

const apiReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: createMessage('Se superó el límite de consultas de la API.')
});

const apiWriteLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: createMessage('Se realizaron demasiadas operaciones. Intenta nuevamente en un minuto.')
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: createMessage('Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.')
});

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: createMessage('Demasiados intentos de registro. Intenta nuevamente en 15 minutos.')
});

const uploadLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: createMessage('Se superó el límite de carga de archivos.')
});

module.exports = {
    globalLimiter,
    pageLimiter,
    apiReadLimiter,
    apiWriteLimiter,
    loginLimiter,
    registerLimiter,
    uploadLimiter
};