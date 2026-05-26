const MAX_MESSAGE_LENGTH = 500;

function registerHandlers(io, socket, user, avatar) {
    socket.broadcast.emit('userJoined', { user });

    socket.on('disconnect', () => {
        socket.broadcast.emit('userLeft', { user });
    });

    socket.on('message', (message) => {
        if (typeof message !== 'string' || !message.trim()) return;
        io.emit('message', {
            user,
            avatar,
            message: message.trim().slice(0, MAX_MESSAGE_LENGTH),
            timestamp: new Date().toLocaleTimeString()
        });
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', { user });
    });

    socket.on('stopTyping', () => {
        socket.broadcast.emit('stopTyping');
    });
}

module.exports = { registerHandlers };
