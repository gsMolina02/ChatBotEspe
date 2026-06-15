const { DEFAULT_AVATAR } = require('../config/chat.constants');

function buildAvatarPath(file) {
    return file ? `/uploads/${file.filename}` : DEFAULT_AVATAR;
}

module.exports = { buildAvatarPath };
