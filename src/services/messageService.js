require('../instrument');
const Sentry = require('@sentry/node');
const { MAX_MESSAGE_LENGTH } = require('../config/chat.constants');

function buildChatMessage(user, avatar, message) {
    try {
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
    } catch (err) {
        Sentry.captureException(err, {
            tags: { source: 'buildChatMessage' },
        });
    }
}

function registerSocketErrorHandler(socket) {
    socket.on('error', (err) => {
        Sentry.captureException(err, {
            tags: { source: 'socket.io', event: 'error' },
            extra: { socketID: socket.id }
        });
    });
}

module.exports = { buildChatMessage, registerSocketErrorHandler };
