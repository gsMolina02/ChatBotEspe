const { SOCKET_EVENTS, MAX_MESSAGE_LENGTH } = require('../config/chat.constants');
const { buildChatMessage, saveMessage, getRoomHistory } = require('../services/messageService');
const { createSocketRateLimiter } = require('../utils/socketRateLimiter');

const messageLimiter = createSocketRateLimiter({
    points: 10,
    durationMs: 10 * 1000,
    blockDurationMs: 30 * 1000
});

const typingLimiter = createSocketRateLimiter({
    points: 20,
    durationMs: 10 * 1000,
    blockDurationMs: 15 * 1000
});

function registerHandlers(io, socket, user, avatar, room) {
    socket.join(room);
    socket.emit(SOCKET_EVENTS.ROOM_HISTORY, getRoomHistory(room));
    socket.to(room).emit(SOCKET_EVENTS.USER_JOINED, { user });

    socket.on(SOCKET_EVENTS.MESSAGE, message => {
        if (!messageLimiter.consume(socket, SOCKET_EVENTS.MESSAGE)) return;

        if (typeof message !== 'string' || !message.trim() || message.trim().length > MAX_MESSAGE_LENGTH) {
            socket.emit('messageError', {
                message: `El mensaje debe contener entre 1 y ${MAX_MESSAGE_LENGTH} caracteres.`
            });

            return;
        }

        const payload = buildChatMessage(user, avatar, message.trim());

        if (!payload) return;

        saveMessage(room, payload);
        io.to(room).emit(SOCKET_EVENTS.MESSAGE, payload);
    });

    socket.on(SOCKET_EVENTS.TYPING, () => {
        if (!typingLimiter.consume(socket, SOCKET_EVENTS.TYPING)) return;
        socket.to(room).emit(SOCKET_EVENTS.TYPING, { user });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, () => {
        if (!typingLimiter.consume(socket, SOCKET_EVENTS.STOP_TYPING)) return;
        socket.to(room).emit(SOCKET_EVENTS.STOP_TYPING);
    });

    socket.on('disconnect', () => {
        messageLimiter.remove(socket);
        typingLimiter.remove(socket);
        socket.to(room).emit(SOCKET_EVENTS.USER_LEFT, { user });
    });
}

module.exports = {
    registerHandlers
};