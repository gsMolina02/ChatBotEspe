const { registerHandlers } = require('./handlers/socketHandlers');

const parseCookies = (cookieHeader = '') => {
    return cookieHeader.split(';').reduce((acc, pair) => {
        const [key, ...val] = pair.trim().split('=');
        acc[key] = val.join('=');
        return acc;
    }, {});
};

module.exports = httpserver => {
    const { Server } = require('socket.io');
    const io = new Server(httpserver);

    io.on('connection', (socket) => {
        const cookies = parseCookies(socket.request.headers.cookie);
        const user = cookies.username;
        const avatar = cookies.avatar;

        if (!user) {
            socket.disconnect(true);
            return;
        }

        registerHandlers(io, socket, user, avatar);
    });
};
