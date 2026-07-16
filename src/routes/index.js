require('../instrument');

const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const isLoggedIn = require('../middleware/isLoggedIn');
const { ROOMS } = require('../config/chat.constants');
const { getReviewsByCategory, addReview } = require('../services/reviewService');
const { getRatings, addRating } = require('../services/ratingService');
const { createUser, verifyUser, updateUser, getUserById, normalizeEspeEmail } = require('../services/userService');
const { getIo } = require('../socket');
const {
    pageLimiter,
    apiReadLimiter,
    apiWriteLimiter,
    loginLimiter,
    registerLimiter,
    uploadLimiter
} = require('../middleware/requestLimits');

const router = express.Router();
const views = path.join(__dirname, '../views');

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
]);

const allowedExtensions = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp'
]);

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}${extension}`;
        callback(null, filename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
        fields: 10,
        fieldNameSize: 50,
        fieldSize: 20 * 1024,
        parts: 12
    },
    fileFilter: (req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();

        if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
            callback(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'));
            return;
        }

        callback(null, true);
    }
});

const urlencodedParser = express.urlencoded({
    extended: false,
    limit: '20kb',
    parameterLimit: 20
});

const jsonParser = express.json({
    limit: '10kb',
    strict: true
});

const COOKIE_OPTS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000
};

function avatarUrl(user) {
    return user.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=006633&color=fff&size=56&bold=true`;
}

function setAuthCookies(res, user) {
    res.cookie('userId', user.id, COOKIE_OPTS);
    res.cookie('username', user.username, COOKIE_OPTS);
    res.cookie('avatar', avatarUrl(user), COOKIE_OPTS);
}

function validText(value, maxLength) {
    return typeof value === 'string' &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength;
}

router.get('/login', pageLimiter, (req, res) => {
    if (req.cookies.userId) return res.redirect('/rooms');
    res.sendFile(path.join(views, 'login.html'));
});

router.post('/login',loginLimiter,urlencodedParser,async(req,res)=>{try{const email=normalizeEspeEmail(req.body.email);const password=String(req.body.password||'');if(!password||password.length>128)throw new Error('Completa correctamente todos los campos.');const user=await verifyUser(email,password);setAuthCookies(res,user);return res.redirect('/rooms');}catch(error){return res.redirect('/login?error='+encodeURIComponent(error.message));}});

router.get('/register', pageLimiter, (req, res) => {
    if (req.cookies.userId) return res.redirect('/rooms');
    res.sendFile(path.join(views, 'register.html'));
});

router.post('/register',registerLimiter,uploadLimiter,upload.single('avatar'),async(req,res)=>{try{const email=normalizeEspeEmail(req.body.email);const password=String(req.body.password||'');const confirm=String(req.body.confirm||'');const username=String(req.body.username||'').trim();const phone=String(req.body.phone||'').trim();const gender=String(req.body.gender||'').trim();if(!username||username.length>80||!phone||phone.length>20||!gender||gender.length>30||password.length<6||password.length>128)throw new Error('Completa correctamente los campos obligatorios.');if(password!==confirm)throw new Error('Las contraseñas no coinciden.');const avatar=req.file?`/uploads/${req.file.filename}`:null;const user=await createUser({email,password,username,phone,gender,avatar});setAuthCookies(res,user);return res.redirect('/rooms');}catch(error){return res.redirect('/register?error='+encodeURIComponent(error.message));}});

router.get('/logout', pageLimiter, (req, res) => {
    res.clearCookie('userId', COOKIE_OPTS);
    res.clearCookie('username', COOKIE_OPTS);
    res.clearCookie('avatar', COOKIE_OPTS);
    res.redirect('/login');
});

router.get('/profile', isLoggedIn, pageLimiter, (req, res) => {
    res.sendFile(path.join(views, 'profile.html'));
});

router.get('/api/me', isLoggedIn, apiReadLimiter, async (req, res) => {
    const user = await getUserById(req.cookies.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado.'
        });
    }

    const {
        passwordHash,
        failedLoginAttempts,
        lockUntil,
        lastFailedLogin,
        ...safeUser
    } = user;

    res.json(safeUser);
});

router.post('/profile', isLoggedIn, apiWriteLimiter, uploadLimiter, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.cookies.userId;
        const { email, phone, currentPassword, newPassword, confirmPassword } = req.body;

        if (email) {
            normalizeEspeEmail(email);
        }

        if (phone && !validText(phone, 20)) {
            throw new Error('El número telefónico no es válido.');
        }

        if (newPassword) {
            if (newPassword.length < 6 || newPassword.length > 128) {
                throw new Error('La nueva contraseña debe contener entre 6 y 128 caracteres.');
            }

            if (newPassword !== confirmPassword) {
                throw new Error('Las nuevas contraseñas no coinciden.');
            }

            if (!currentPassword) {
                throw new Error('Ingresa tu contraseña actual para cambiarla.');
            }

            const user = await getUserById(userId);

            if (!user) {
                throw new Error('Usuario no encontrado.');
            }

            const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);

            if (!validPassword) {
                throw new Error('La contraseña actual es incorrecta.');
            }
        }

        const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;

        const updated = await updateUser(userId, {
            email: email ? email.trim().toLowerCase() : undefined,
            password: newPassword || undefined,
            phone: phone ? phone.trim() : undefined,
            avatar
        });

        res.cookie('avatar', avatarUrl(updated), COOKIE_OPTS);

        res.json({
            success: true,
            avatar: avatarUrl(updated)
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/', isLoggedIn, pageLimiter, (req, res) => {
    if (!req.query.room) return res.redirect('/rooms');
    res.sendFile(path.join(views, 'index.html'));
});

router.get('/rooms', isLoggedIn, pageLimiter, (req, res) => {
    res.sendFile(path.join(views, 'rooms.html'));
});

router.get('/api/rooms', isLoggedIn, apiReadLimiter, (req, res) => {
    res.json(ROOMS);
});

router.get('/api/reviews', isLoggedIn, apiReadLimiter, async (req, res) => {
    try {
        const category = String(req.query.category || '').trim();

        if (!validText(category, 50) || !Object.prototype.hasOwnProperty.call(ROOMS, category)) {
            return res.status(400).json({
                success: false,
                error: 'La categoría solicitada no es válida.'
            });
        }

        res.json(await getReviewsByCategory(category));
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'No fue posible consultar las reseñas.'
        });
    }
});

router.post('/api/reviews', isLoggedIn, apiWriteLimiter, jsonParser, async (req, res) => {
    try {
        const { category, roomId, roomName, content, citedRoom } = req.body;
        const normalizedCategory = String(category || '').trim();
        const normalizedRoomId = roomId ? String(roomId).trim().slice(0, 100) : null;
        const normalizedRoomName = roomName ? String(roomName).trim().slice(0, 150) : null;
        const normalizedCitedRoom = citedRoom ? String(citedRoom).trim().slice(0, 150) : null;

        if (
            !Object.prototype.hasOwnProperty.call(ROOMS, normalizedCategory) ||
            !validText(content, 500) ||
            (!normalizedRoomId && !normalizedRoomName && !normalizedCitedRoom)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Los datos de la reseña no son válidos.'
            });
        }

        const review = await addReview({
            userId: req.cookies.userId,
            category: normalizedCategory,
            roomId: normalizedRoomId,
            roomName: normalizedRoomName,
            author: req.cookies.username,
            avatar: req.cookies.avatar,
            content: content.trim(),
            citedRoom: normalizedCitedRoom
        });

        const io = getIo();

        if (io) {
            io.of('/reviews')
                .to(normalizedCategory)
                .emit('newReview', review);
        }

        res.status(201).json({
            success: true,
            review
        });
    } catch (error) {
        if (error.message === 'Ya registraste una reseña para este elemento.') {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/api/ratings', isLoggedIn, apiReadLimiter, async (req, res) => {
    try {
        res.json(await getRatings());
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'No fue posible consultar las calificaciones.'
        });
    }
});

router.post('/api/ratings', isLoggedIn, apiWriteLimiter, jsonParser, async (req, res) => {
    try {
        const profId = String(req.body.profId || '').trim();
        const score = Number(req.body.score);

        if (
            !validText(profId, 100) ||
            !Number.isInteger(score) ||
            score < 1 ||
            score > 5
        ) {
            return res.status(400).json({
                success: false,
                error: 'Los datos de la calificación no son válidos.'
            });
        }

        const professors = ROOMS.profesores.rooms;
        const professorExists = professors.some(professor => professor.id === profId);

        if (!professorExists) {
            return res.status(400).json({
                success: false,
                error: 'El profesor seleccionado no existe.'
            });
        }

        const updatedRating = await addRating(
            req.cookies.userId,
            profId,
            score
        );

        const io = getIo();

        if (io) {
            io.of('/reviews').emit('ratingUpdated', {
                profId,
                rating: updatedRating
            });
        }

        res.json({
            success: true,
            rating: updatedRating
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'No fue posible registrar la calificación.'
        });
    }
});

router.use((error, req, res, next) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            error: 'La imagen no puede superar 2 MB.'
        });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            success: false,
            error: 'Solo se permite subir una imagen.'
        });
    }

    if (
        error.code === 'LIMIT_FIELD_COUNT' ||
        error.code === 'LIMIT_PART_COUNT' ||
        error.code === 'LIMIT_FIELD_KEY' ||
        error.code === 'LIMIT_FIELD_VALUE'
    ) {
        return res.status(400).json({
            success: false,
            error: 'El formulario contiene demasiados datos.'
        });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: 'El cuerpo de la solicitud es demasiado grande.'
        });
    }

    if (error.message === 'Solo se permiten imágenes JPG, PNG o WEBP.') {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    next(error);
});

module.exports = router;