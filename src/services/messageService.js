const { MAX_MESSAGE_LENGTH } = require('../config/chat.constants');

function buildChatMessage(user, avatar, message) {
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';

    if (!normalizedMessage) {
        return null;
    }

    return {
        user,
        avatar,
        message: normalizedMessage.slice(0, MAX_MESSAGE_LENGTH),
        timestamp: new Date().toLocaleTimeString()
    };
}

module.exports = { buildChatMessage };