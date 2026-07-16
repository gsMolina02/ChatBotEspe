const { registerHandlers } = require('./handlers/socketHandlers');
const { parseCookies } = require('./utils/cookieParser');

module.exports = httpserver => {
    const { Server } = require('socket.io');
    const io = new Server(httpserver, {
        path: '/api/v1/stream'
    });

    io.on('connection', (socket) => {
        const cookies = parseCookies(socket.request.headers.cookie);
        const user = cookies.username;
        const avatar = cookies.avatar;

        if (!user) {
            socket.disconnect(true);
            return;
        }

        socket.data.userContext = { user, avatar };
        registerHandlers(io, socket, user, avatar);
    });
};
