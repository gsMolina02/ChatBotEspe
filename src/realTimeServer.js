require('./instrument');
const Sentry = require('@sentry/node');
const { registerHandlers } = require('./handlers/socketHandlers');
const { parseCookies } = require('./utils/cookieParser');
const { setIo } = require('./socket');

module.exports = httpserver => {
    const { Server } = require('socket.io');
    const io = new Server(httpserver, {
      path: '/api/v1/stream'});
        setIo(io);

    const reviewsNs = io.of('/reviews');
    reviewsNs.on('connection', (socket) => {
      socket.on('joinCategory', (category) => {
        [...socket.rooms].forEach(r => { if (r !== socket.id) socket.leave(r); });
        socket.join(category);
      });
      });

 

    });

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
