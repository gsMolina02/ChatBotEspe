const bcrypt = require('bcryptjs');
const db = require('../config/firebase');
const col = db.collection('users');

async function getUserByEmail(email) {
    const snap = await col.where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}

async function getUserByUsername(username) {
    const snap = await col.where('username', '==', username).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
}

async function getUserById(id) {
    const snap = await col.doc(id).get();
    if (!snap.exists) return null;
    return { id, ...snap.data() };
}

async function createUser({ email, password, username, phone, gender, avatar }) {
    if (await getUserByEmail(email)) throw new Error('El correo ya está registrado.');
    if (await getUserByUsername(username)) throw new Error('El nombre de usuario ya está en uso.');
    const passwordHash = await bcrypt.hash(password, 10);
    const ref = await col.add({
        email,
        passwordHash,
        username,
        phone: phone || '',
        gender: gender || '',
        avatar: avatar || null,
        createdAt: new Date().toISOString()
    });
    return { id: ref.id, email, username, phone: phone || '', gender: gender || '', avatar: avatar || null };
}

async function verifyUser(email, password) {
    const user = await getUserByEmail(email);
    if (!user) throw new Error('Credenciales incorrectas.');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Credenciales incorrectas.');
    return user;
}

async function updateUser(id, { email, password, phone, avatar }) {
    const updates = {};
    if (email) {
        const existing = await getUserByEmail(email);
        if (existing && existing.id !== id) throw new Error('El correo ya está en uso por otra cuenta.');
        updates.email = email;
    }
    if (password) {
        updates.passwordHash = await bcrypt.hash(password, 10);
    }
    if (phone !== undefined && phone !== null) updates.phone = phone;
    if (avatar !== undefined && avatar !== null) updates.avatar = avatar;
    await col.doc(id).update(updates);
    return getUserById(id);
}

module.exports = { createUser, verifyUser, updateUser, getUserById, getUserByEmail };
