require('./instrument');

const { registerHandlers } = require('./handlers/socketHandlers');
const { parseCookies } = require('./utils/cookieParser');
const { setIo } = require('./socket');
const { createSocketRateLimiter } = require('./utils/socketRateLimiter');
const { ROOMS } = require('./config/chat.constants');

const connectionLimiter = createSocketRateLimiter({
    points: 15,
    durationMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
    keyGenerator: socket => socket.handshake.address || 'unknown'
});

const categoryLimiter = createSocketRateLimiter({
    points: 10,
    durationMs: 10 * 1000,
    blockDurationMs: 30 * 1000
});

function getValidRoomIds() {
    const roomIds = new Set();

    Object.values(ROOMS).forEach(category => {
        if (Array.isArray(category.rooms)) {
            category.rooms.forEach(room => roomIds.add(room.id));
        }

        if (Array.isArray(category.subcategories)) {
            category.subcategories.forEach(subcategory => {
                if (Array.isArray(subcategory.rooms)) {
                    subcategory.rooms.forEach(room => roomIds.add(room.id));
                }
            });
        }
    });

    return roomIds;
}

const validRoomIds = getValidRoomIds();

function validCategory(category) {
    return typeof category === 'string' &&
        Object.prototype.hasOwnProperty.call(ROOMS, category) &&
        category.length <= 50;
}

module.exports = httpserver => {
    const { Server } = require('socket.io');

    const io = new Server(httpserver, {
        serveClient: true,
        maxHttpBufferSize: 16 * 1024,
        connectTimeout: 10 * 1000,
        pingInterval: 25 * 1000,
        pingTimeout: 20 * 1000,
        perMessageDeflate: false,
        httpCompression: false,
        allowEIO3: false,
        transports: ['polling', 'websocket']
    });

    setIo(io);

    io.use((socket, next) => {
        if (!connectionLimiter.consume(socket, 'connection')) {
            next(new Error('Demasiadas conexiones desde la misma dirección.'));
            return;
        }

        const cookies = parseCookies(socket.request.headers.cookie);

        if (!cookies || !cookies.userId || !cookies.username) {
            next(new Error('Socket no autorizado.'));
            return;
        }

        const room = String(socket.handshake.query.room || '');

        if (!validRoomIds.has(room)) {
            next(new Error('La sala seleccionada no existe.'));
            return;
        }

        next();
    });

    const reviewsNamespace = io.of('/reviews');

    reviewsNamespace.use((socket, next) => {
        const cookies = parseCookies(socket.request.headers.cookie);

        if (!cookies || !cookies.userId || !cookies.username) {
            next(new Error('Socket no autorizado.'));
            return;
        }

        next();
    });

    reviewsNamespace.on('connection', socket => {
        socket.on('joinCategory', category => {
            if (!categoryLimiter.consume(socket, 'joinCategory')) return;
            if (!validCategory(category)) return;

            for (const currentRoom of socket.rooms) {
                if (currentRoom !== socket.id) {
                    socket.leave(currentRoom);
                }
            }

            socket.join(category);
        });

        socket.on('disconnect', () => {
            categoryLimiter.remove(socket);
        });
    });

    io.on('connection', socket => {
        const cookies = parseCookies(socket.request.headers.cookie);
        const user = String(cookies.username || '').trim();
        const avatar = cookies.avatar || null;
        const room = String(socket.handshake.query.room || '');

        if (!user || user.length > 80 || !validRoomIds.has(room)) {
            socket.disconnect(true);
            return;
        }

        socket.data.userContext = {
            userId: cookies.userId,
            user,
            avatar,
            room
        };

        registerHandlers(io, socket, user, avatar, room);
    });

    io.engine.on('connection_error', error => {
        console.error('Conexión Socket.IO rechazada:', error.message);
    });
};