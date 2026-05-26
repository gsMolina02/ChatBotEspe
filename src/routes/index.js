const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const isLoggedIn = require('../middleware/isLoggedIn');
const { buildAvatarPath } = require('../services/userService');

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

router.get('/', isLoggedIn, (req, res) => {
    res.sendFile(views + '/index.html');
});

router.get('/register', (req, res) => {
    res.sendFile(views + '/register.html');
});

router.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('avatar');
    res.redirect('/register');
});

router.post('/register', upload.single('avatar'), (req, res) => {
    const { username } = req.body;
    res.cookie('username', username);
    res.cookie('avatar', buildAvatarPath(req.file));
    res.redirect('/');
});

router.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('La imagen no puede superar 2MB.');
    }
    next(err);
});

module.exports = router;