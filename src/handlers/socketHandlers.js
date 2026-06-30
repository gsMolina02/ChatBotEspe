const { SOCKET_EVENTS } = require('../config/chat.constants');
const { buildChatMessage } = require('../services/messageService');

function registerHandlers(io, socket, user, avatar, room) {
    socket.join(room);
    socket.to(room).emit(SOCKET_EVENTS.USER_JOINED, { user });

    socket.on('disconnect', () => {
        socket.to(room).emit(SOCKET_EVENTS.USER_LEFT, { user });
    });

    socket.on(SOCKET_EVENTS.MESSAGE, (message) => {
        const payload = buildChatMessage(user, avatar, message);

        if (!payload) {
            return;
        }

        io.to(room).emit(SOCKET_EVENTS.MESSAGE, payload);
    });

    socket.on(SOCKET_EVENTS.TYPING, () => {
        socket.to(room).emit(SOCKET_EVENTS.TYPING, { user });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, () => {
        socket.to(room).emit(SOCKET_EVENTS.STOP_TYPING);
    });
}

module.exports = { registerHandlers };
