const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

function buildAvatarPath(file) {
    return file ? `/uploads/${file.filename}` : DEFAULT_AVATAR;
}

module.exports = { buildAvatarPath };
