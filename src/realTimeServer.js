//Conexion bidireccional

const parseCookies = (cookieHeader = '') => {
    return cookieHeader.split(';').reduce((acc, pair) => {
        const [key, ...val] = pair.trim().split('=');
        acc[key] = val.join('=');
        return acc;
    }, {});
};

module.exports = httpserver => {
    const {Server} = require('socket.io');
    const io = new Server(httpserver);

    io.on('connection', (socket) => {
        const cookies = parseCookies(socket.request.headers.cookie);
        const user = cookies.username;
        const avatar = cookies.avatar;

        socket.broadcast.emit('userJoined', { user });

        socket.on('disconnect', () => {
            socket.broadcast.emit('userLeft', { user });
        });

        socket.on('message', (message) => {
            io.emit('message', {
                user,
                avatar,
                message,
                timestamp: new Date().toLocaleTimeString()
            });
        });

        socket.on('typing', () => {
            socket.broadcast.emit('typing', { user });
        });

        socket.on('stopTyping', () => {
            socket.broadcast.emit('stopTyping');
        });
    });
};
