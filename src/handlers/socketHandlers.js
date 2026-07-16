const { SOCKET_EVENTS } = require('../config/chat.constants');
const { buildChatMessage, saveMessage, getRoomHistory } = require('../services/messageService');
const { logEvent, ORIGENES } = require('../services/loggerService');

function registerHandlers(io, socket, user, avatar, room) {
    socket.join(room);

    logEvent({ accion: 'CONEXION_CHAT', usuario: user, rol: 'estudiante', origen: ORIGENES.WS, detalle: { sala: room } });

    socket.emit(SOCKET_EVENTS.ROOM_HISTORY, getRoomHistory(room));

    socket.to(room).emit(SOCKET_EVENTS.USER_JOINED, { user });

    socket.on('disconnect', () => {
        logEvent({ accion: 'DESCONEXION_CHAT', usuario: user, rol: 'estudiante', origen: ORIGENES.WS, detalle: { sala: room } });
        socket.to(room).emit(SOCKET_EVENTS.USER_LEFT, { user });
    });

    socket.on(SOCKET_EVENTS.MESSAGE, (message) => {
        const payload = buildChatMessage(user, avatar, message);

        if (!payload) {
            return;
        }

        saveMessage(room, payload);
        logEvent({ accion: 'MENSAJE_ENVIADO', usuario: user, rol: 'estudiante', origen: ORIGENES.WS, detalle: { sala: room, longitud: payload.message.length } });
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
