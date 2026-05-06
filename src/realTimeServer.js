//Conexion bidireccional

module.exports = httpserver => {
    const {Server} = require('socket.io');
    const io = new Server(httpserver);

    io.on('connection', socket => {
        console.log(socket.id);
    })
};