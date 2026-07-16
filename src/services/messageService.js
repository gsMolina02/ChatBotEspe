require('../instrument');
const Sentry = require('@sentry/node');
const { MAX_MESSAGE_LENGTH, MAX_ROOM_HISTORY } = require('../config/chat.constants');

const roomHistories = new Map();

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

function saveMessage(room, payload) {
    if (!roomHistories.has(room)) {
        roomHistories.set(room, []);
    }
    const history = roomHistories.get(room);
    history.push(payload);
    if (history.length > MAX_ROOM_HISTORY) {
        history.shift();
    }
}

function getRoomHistory(room) {
    return roomHistories.get(room) || [];
}

function registerSocketErrorHandler(socket) {
    socket.on('error', (err) => {
        Sentry.captureException(err, {
            tags: { source: 'socket.io', event: 'error' },
            extra: { socketID: socket.id }
        });
    });
}

module.exports = { buildChatMessage, saveMessage, getRoomHistory, registerSocketErrorHandler };
