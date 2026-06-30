require('../instrument');
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const isLoggedIn = require('../middleware/isLoggedIn');
const { createRegistrationPayload } = require('../services/registrationService');
const { MAX_AVATAR_SIZE, ROOMS } = require('../config/chat.constants');
const { getReviewsByCategory, addReview } = require('../services/reviewService');
const { getRatings, addRating } = require('../services/ratingService');

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
const upload = multer({ storage, limits: { fileSize: MAX_AVATAR_SIZE } });

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

router.get('/api/reviews', isLoggedIn, (req, res) => {
    const { category } = req.query;
    if (!category) return res.status(400).json({ error: 'category requerida' });
    res.json(getReviewsByCategory(category));
});

router.post('/api/reviews', isLoggedIn, express.json(), (req, res) => {
    const { category, roomId, roomName, content, citedRoom } = req.body;
    if (!category || !content?.trim()) {
        return res.status(400).json({ error: 'Campos inválidos' });
    }
    const review = addReview({
        category,
        roomId: roomId || null,
        roomName: roomName || null,
        author: req.cookies.username,
        avatar: req.cookies.avatar,
        content,
        citedRoom: citedRoom || null
    });
    res.json(review);
});

router.get('/api/ratings', isLoggedIn, (req, res) => {
    res.json(getRatings());
});

router.post('/api/ratings', isLoggedIn, express.json(), (req, res) => {
    const { profId, score } = req.body;
    const s = Number(score);
    if (!profId || !s || s < 1 || s > 5) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    res.json(addRating(profId, s));
});

router.get('/register', (req, res) => {
    res.sendFile(views + '/register.html');
});

router.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('avatar');
    res.redirect('/register');
});

router.get('/debug-sentry', (req, res) => {
    throw new Error('Prueba sentry: Error intencional en el backend');
});

router.post('/register', upload.single('avatar'), (req, res) => {
    try {
        const { username, avatar } = createRegistrationPayload(req.body, req.file);
        res.cookie('username', username);
        res.cookie('avatar', avatar);
    } catch (error) {
        return res.status(400).send(error.message);
    }

    res.redirect('/rooms');
});

router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('La imagen no puede superar 2MB.');
    }
    next(err);
});

module.exports = router;