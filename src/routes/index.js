require('../instrument');
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const isLoggedIn = require('../middleware/isLoggedIn');
const { ROOMS } = require('../config/chat.constants');
const { getReviewsByCategory, addReview } = require('../services/reviewService');
const { getRatings, addRating } = require('../services/ratingService');
const { createUser, verifyUser, updateUser, getUserById } = require('../services/userService');
const { logEvent, ORIGENES } = require('../services/loggerService');
const { getIo } = require('../socket');

const views = path.join(__dirname, '../views');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' };

function avatarUrl(user) {
    return user.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=006633&color=fff&size=56&bold=true`;
}

function setAuthCookies(res, user) {
    res.cookie('userId', user.id, COOKIE_OPTS);
    res.cookie('username', user.username, COOKIE_OPTS);
    res.cookie('avatar', avatarUrl(user), COOKIE_OPTS);
}

/* ── Hardening de login: 3 intentos fallidos en 15 minutos por IP ── */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    skipSuccessfulRequests: true,
    requestWasSuccessful: (req, res) => !res.locals.loginFallido,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logEvent({
            accion: 'LOGIN_BLOQUEADO',
            usuario: (req.body && req.body.email) || 'desconocido',
            rol: 'anonimo',
            origen: ORIGENES.MS,
            detalle: { ip: req.ip, criterio: '3 intentos fallidos en 15 min' }
        });
        res.redirect('/login?error=' + encodeURIComponent('Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.'));
    }
});

/* ── Auth ── */

router.get('/login', (req, res) => {
    if (req.cookies.userId) return res.redirect('/rooms');
    res.sendFile(views + '/login.html');
});

router.post('/login', express.urlencoded({ extended: false }), loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) throw new Error('Completa todos los campos.');
        const user = await verifyUser(email, password);
        setAuthCookies(res, user);
        logEvent({ accion: 'LOGIN_EXITOSO', usuario: user.username, rol: 'estudiante', origen: ORIGENES.MS, detalle: { email } });
        res.redirect('/rooms');
    } catch (err) {
        res.locals.loginFallido = true;
        logEvent({ accion: 'LOGIN_FALLIDO', usuario: req.body.email || 'desconocido', rol: 'anonimo', origen: ORIGENES.MS, detalle: { motivo: err.message } });
        res.redirect('/login?error=' + encodeURIComponent(err.message));
    }
});

router.get('/register', (req, res) => {
    if (req.cookies.userId) return res.redirect('/rooms');
    res.sendFile(views + '/register.html');
});

router.post('/register', upload.single('avatar'), async (req, res) => {
    try {
        const { email, password, confirm, username, phone, gender } = req.body;
        if (!email || !password || !username || !phone || !gender) {
            throw new Error('Completa todos los campos obligatorios.');
        }
        if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
        if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
        const avatar = req.file ? `/uploads/${req.file.filename}` : null;
        const user = await createUser({ email, password, username, phone, gender, avatar });
        setAuthCookies(res, user);
        logEvent({ accion: 'REGISTRO_USUARIO', usuario: user.username, rol: 'estudiante', origen: ORIGENES.MS, detalle: { email } });
        res.redirect('/rooms');
    } catch (err) {
        logEvent({ accion: 'REGISTRO_FALLIDO', usuario: req.body.username || 'desconocido', rol: 'anonimo', origen: ORIGENES.MS, detalle: { motivo: err.message } });
        res.redirect('/register?error=' + encodeURIComponent(err.message));
    }
});

router.get('/logout', (req, res) => {
    logEvent({ accion: 'LOGOUT', usuario: req.cookies.username || 'desconocido', rol: 'estudiante', origen: ORIGENES.MS });
    res.clearCookie('userId');
    res.clearCookie('username');
    res.clearCookie('avatar');
    res.redirect('/login');
});

/* ── Profile ── */

router.get('/profile', isLoggedIn, (req, res) => {
    res.sendFile(views + '/profile.html');
});

router.get('/api/me', isLoggedIn, async (req, res) => {
    const user = await getUserById(req.cookies.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const { passwordHash, ...safe } = user;
    res.json(safe);
});

router.post('/profile', isLoggedIn, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { email, phone, currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword) {
            if (newPassword !== confirmPassword) throw new Error('Las nuevas contraseñas no coinciden.');
            if (newPassword.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
            if (!currentPassword) throw new Error('Ingresa tu contraseña actual para cambiarla.');
            const user = await getUserById(userId);
            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid) throw new Error('La contraseña actual es incorrecta.');
        }

        const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;
        const updated = await updateUser(userId, {
            email: email || undefined,
            password: newPassword || undefined,
            phone: phone || undefined,
            avatar
        });

        res.cookie('avatar', avatarUrl(updated), COOKIE_OPTS);
        logEvent({
            accion: 'ACTUALIZACION_PERFIL',
            usuario: req.cookies.username,
            rol: 'estudiante',
            origen: ORIGENES.MS,
            detalle: { camposModificados: Object.keys(req.body).filter(k => req.body[k] && !k.toLowerCase().includes('password')), cambioPassword: Boolean(newPassword), cambioAvatar: Boolean(req.file) }
        });
        res.json({ success: true, avatar: avatarUrl(updated) });
    } catch (err) {
        logEvent({ accion: 'ACTUALIZACION_PERFIL_FALLIDA', usuario: req.cookies.username, rol: 'estudiante', origen: ORIGENES.MS, detalle: { motivo: err.message } });
        res.json({ error: err.message });
    }
});

/* ── Chat & rooms ── */

router.get('/', isLoggedIn, (req, res) => {
    if (!req.query.room) return res.redirect('/rooms');
    res.sendFile(views + '/index.html');
});

router.get('/rooms', isLoggedIn, (req, res) => {
    res.sendFile(views + '/rooms.html');
});

router.get('/api/rooms', isLoggedIn, (req, res) => {
    res.json(ROOMS);
});

/* ── Reviews ── */

router.get('/api/reviews', isLoggedIn, async (req, res) => {
    const { category } = req.query;
    if (!category) return res.status(400).json({ error: 'category requerida' });
    res.json(await getReviewsByCategory(category));
});

router.post('/api/reviews', isLoggedIn, express.json(), async (req, res) => {
    const { category, roomId, roomName, content, citedRoom } = req.body;
    if (!category || !content?.trim()) {
        return res.status(400).json({ error: 'Campos inválidos' });
    }
    const review = await addReview({
        category,
        roomId: roomId || null,
        roomName: roomName || null,
        author: req.cookies.username,
        avatar: req.cookies.avatar,
        content,
        citedRoom: citedRoom || null
    });
    const io = getIo();
    if (io) io.of('/reviews').to(category).emit('newReview', review);
    logEvent({ accion: 'PUBLICAR_RESENA', usuario: req.cookies.username, rol: 'estudiante', origen: ORIGENES.MS, detalle: { categoria: category, salaCitada: roomName || null } });
    res.json(review);
});

/* ── Ratings ── */

router.get('/api/ratings', isLoggedIn, async (req, res) => {
    res.json(await getRatings());
});

router.post('/api/ratings', isLoggedIn, express.json(), async (req, res) => {
    const { profId, score } = req.body;
    const s = Number(score);
    if (!profId || !s || s < 1 || s > 5) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    const updated = await addRating(profId, s);
    const io = getIo();
    if (io) io.of('/reviews').emit('ratingUpdated', { profId, rating: updated });
    logEvent({ accion: 'CALIFICAR_PROFESOR', usuario: req.cookies.username, rol: 'estudiante', origen: ORIGENES.MS, detalle: { profesor: profId, puntaje: s } });
    res.json(updated);
});

/* ── Misc ── */

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

router.get('/debug-sentry', (req, res) => {
    throw new Error('Prueba sentry: Error intencional en el backend');
});

router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('La imagen no puede superar 2MB.');
    }
    next(err);
});

module.exports = router;
