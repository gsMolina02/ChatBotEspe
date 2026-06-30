require('./instrument');
const Sentry = require('@sentry/node');
const { registerHandlers } = require('./handlers/socketHandlers');
const { parseCookies } = require('./utils/cookieParser');

module.exports = httpserver => {
    const { Server } = require('socket.io');
    const io = new Server(httpserver);

    io.on('connection', (socket) => {
        const cookies = parseCookies(socket.request.headers.cookie);
        if (!cookies) {
            throw new Error('No se pudieron parsear las cookies del socket');
        }
        const user = cookies.username;
        const avatar = cookies.avatar;
        const room = socket.handshake.query.room;

        if (!user || !room) {
            socket.disconnect(true);
            return;
        }

        socket.data.userContext = { user, avatar, room };
        registerHandlers(io, socket, user, avatar, room);
    });
};
