const { DEFAULT_AVATAR } = require('../config/chat.constants');

function normalizeUsername(username) {
    const value = typeof username === 'string' ? username.trim() : '';

    if (!value) {
        throw new Error('El nombre de usuario es obligatorio.');
    }

    return value;
}

function buildAvatarPath(file) {
    return file ? `/uploads/${file.filename}` : DEFAULT_AVATAR;
}

function createRegistrationPayload(body, file) {
    return {
        username: normalizeUsername(body.username),
        avatar: buildAvatarPath(file)
    };
}

module.exports = {
    normalizeUsername,
    buildAvatarPath,
    createRegistrationPayload
};