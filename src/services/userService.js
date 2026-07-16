const bcrypt = require('bcryptjs');
const db = require('../config/firebase');

const col = db.collection('users');
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

function normalizeEspeEmail(email) {
    if (typeof email !== 'string') {
        throw new Error('El correo institucional es obligatorio.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const match = normalizedEmail.match(/^([a-z0-9._-]{2,64})@espe\.edu\.ec$/);

    if (!match) {
        throw new Error('Solo se permiten cuentas institucionales @espe.edu.ec.');
    }

    return normalizedEmail;
}

async function getUserByEmail(email) {
    const normalizedEmail = normalizeEspeEmail(email);
    const snap = await col.where('email', '==', normalizedEmail).limit(1).get();

    if (snap.empty) return null;

    const userDocument = snap.docs[0];

    return {
        id: userDocument.id,
        ...userDocument.data()
    };
}

async function getUserByUsername(username) {
    const normalizedUsername = String(username || '').trim();
    const snap = await col.where('username', '==', normalizedUsername).limit(1).get();

    if (snap.empty) return null;

    const userDocument = snap.docs[0];

    return {
        id: userDocument.id,
        ...userDocument.data()
    };
}

async function getUserById(id) {
    if (typeof id !== 'string' || !id.trim()) return null;

    const snap = await col.doc(id).get();

    if (!snap.exists) return null;

    return {
        id,
        ...snap.data()
    };
}

async function createUser({ email, password, username, phone, gender, avatar }) {
    const normalizedEmail = normalizeEspeEmail(email);
    const normalizedUsername = String(username || '').trim();

    if (await getUserByEmail(normalizedEmail)) {
        throw new Error('El correo ya está registrado.');
    }

    if (await getUserByUsername(normalizedUsername)) {
        throw new Error('El nombre de usuario ya está en uso.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
        email: normalizedEmail,
        passwordHash,
        username: normalizedUsername,
        phone: String(phone || '').trim(),
        gender: String(gender || '').trim(),
        avatar: avatar || null,
        failedLoginAttempts: 0,
        lockUntil: null,
        lastFailedLogin: null,
        createdAt: new Date().toISOString()
    };

    const reference = await col.add(userData);

    return {
        id: reference.id,
        email: normalizedEmail,
        username: normalizedUsername,
        phone: userData.phone,
        gender: userData.gender,
        avatar: userData.avatar
    };
}

async function verifyUser(email, password) {
    const normalizedEmail = normalizeEspeEmail(email);
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
        await bcrypt.compare(String(password || ''), '$2b$12$e0NR5.MJvDlvDUZmy03UnO5Iq1IqpjG4LZLhdYF03CId5T4r4l7eS');
        throw new Error('Credenciales incorrectas.');
    }

    const now = Date.now();
    const lockUntil = user.lockUntil ? new Date(user.lockUntil).getTime() : 0;

    if (lockUntil > now) {
        const remainingMinutes = Math.ceil((lockUntil - now) / 60000);
        throw new Error(`Cuenta bloqueada temporalmente. Intenta nuevamente en ${remainingMinutes} minutos.`);
    }

    if (lockUntil && lockUntil <= now) {
        await col.doc(user.id).update({
            failedLoginAttempts: 0,
            lockUntil: null,
            lastFailedLogin: null
        });

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
    }

    const validPassword = await bcrypt.compare(String(password || ''), user.passwordHash);

    if (!validPassword) {
        const failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
        const updates = {
            failedLoginAttempts,
            lastFailedLogin: new Date().toISOString()
        };

        if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            updates.lockUntil = new Date(now + LOCK_TIME_MS).toISOString();
        }

        await col.doc(user.id).update(updates);

        if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            throw new Error('Cuenta bloqueada temporalmente durante 15 minutos.');
        }

        throw new Error('Credenciales incorrectas.');
    }

    await col.doc(user.id).update({
        failedLoginAttempts: 0,
        lockUntil: null,
        lastFailedLogin: null,
        lastLoginAt: new Date().toISOString()
    });

    return {
        ...user,
        failedLoginAttempts: 0,
        lockUntil: null,
        lastFailedLogin: null
    };
}

async function updateUser(id, { email, password, phone, avatar }) {
    const updates = {};

    if (email) {
        const normalizedEmail = normalizeEspeEmail(email);
        const existing = await getUserByEmail(normalizedEmail);

        if (existing && existing.id !== id) {
            throw new Error('El correo ya está en uso por otra cuenta.');
        }

        updates.email = normalizedEmail;
    }

    if (password) {
        updates.passwordHash = await bcrypt.hash(password, 12);
        updates.failedLoginAttempts = 0;
        updates.lockUntil = null;
        updates.lastFailedLogin = null;
    }

    if (phone !== undefined && phone !== null) {
        updates.phone = String(phone).trim();
    }

    if (avatar !== undefined && avatar !== null) {
        updates.avatar = avatar;
    }

    if (Object.keys(updates).length) {
        await col.doc(id).update(updates);
    }

    return getUserById(id);
}

module.exports = {
    createUser,
    verifyUser,
    updateUser,
    getUserById,
    getUserByEmail,
    normalizeEspeEmail
};