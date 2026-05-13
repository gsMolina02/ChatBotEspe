const { createServer } = require('http');
const express = require('express');
const { io: Client } = require('socket.io-client');
const realTimeServer = require('../src/realTimeServer');

describe('ESPEchat - Eventos Socket.IO', () => {
    let httpServer, port;
    let clientA, clientB;

    beforeAll((done) => {
        const app = express();
        httpServer = createServer(app);
        realTimeServer(httpServer);
        httpServer.listen(0, () => {
            port = httpServer.address().port;
            done();
        });
    });

    afterAll(() => {
        httpServer.close();
    });

    beforeEach((done) => {
        clientA = Client(`http://localhost:${port}`, {
            extraHeaders: { cookie: 'username=Juan' }
        });
        clientB = Client(`http://localhost:${port}`, {
            extraHeaders: { cookie: 'username=Maria' }
        });

        let connected = 0;
        const onConnect = () => { if (++connected === 2) done(); };
        clientA.on('connect', onConnect);
        clientB.on('connect', onConnect);
    });

    afterEach(() => {
        clientA.disconnect();
        clientB.disconnect();
    });

    test('Usuario B recibe evento typing con el nombre correcto cuando A escribe', (done) => {
        clientB.on('typing', ({ user }) => {
            expect(user).toBe('Juan');
            done();
        });
        clientA.emit('typing');
    });

    test('Usuario B recibe evento stopTyping cuando A deja de escribir', (done) => {
        clientB.on('stopTyping', () => {
            done();
        });
        clientA.emit('stopTyping');
    });

    test('Usuario A NO recibe su propio evento typing (socket.broadcast)', (done) => {
        let received = false;
        clientA.on('typing', () => { received = true; });
        clientA.emit('typing');
        setTimeout(() => {
            expect(received).toBe(false);
            done();
        }, 500);
    });

    test('Usuario A NO recibe su propio evento stopTyping (socket.broadcast)', (done) => {
        let received = false;
        clientA.on('stopTyping', () => { received = true; });
        clientA.emit('stopTyping');
        setTimeout(() => {
            expect(received).toBe(false);
            done();
        }, 500);
    });

    test('Todos los usuarios reciben el mensaje con usuario, contenido y timestamp', (done) => {
        clientB.on('message', ({ user, message, timestamp }) => {
            expect(user).toBe('Juan');
            expect(message).toBe('Hola mundo');
            expect(timestamp).toBeDefined();
            done();
        });
        clientA.emit('message', 'Hola mundo');
    });
});
