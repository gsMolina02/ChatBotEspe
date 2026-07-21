require('./instrument');
const express = require('express');
const { createServer } = require('http');
const Sentry = require('@sentry/node');
const realTimeServer = require('./realTimeServer');
const { logEvent, ORIGENES } = require('./services/loggerService');
const path = require('path');
const fs = require('fs');
const https = require('https');

const cookieParser = require('cookie-parser');

const app = express();
app.disable('x-powered-by');

const httpserver = createServer(app);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());

// Cargar y limpiar comentarios de la librería al iniciar el servidor
const clientDistPath = path.join(__dirname, '../node_modules/socket.io/client-dist/socket.io.min.js');
let cleanSocketLib = '';
try {
    const rawContent = fs.readFileSync(clientDistPath, 'utf8');
    // Eliminamos el bloque de comentario inicial que contiene la licencia y versión
    cleanSocketLib = rawContent.replace(/\/\*[\s\S]*?\*\//, '');
} catch (error) {
    console.error('Error al cargar la librería de socket:', error);
}

app.get('/js/conn-lib.js', (req, res) => {
    res.type('application/javascript');
    res.send(cleanSocketLib);
});

app.get('/js/mon.js', (req, res) => {
    https.get('https://browser.sentry-cdn.com/10.66.0/bundle.min.js', (cdnRes) => {
        res.type('application/javascript');
        cdnRes.pipe(res);
    }).on('error', (err) => {
        console.error('Error al proxyar Sentry:', err);
        res.status(500).send('Error');
    });
});

app.use(require('./routes'));

Sentry.setupExpressErrorHandler(app);

app.use(express.static(path.join(__dirname,'public')));
app.use('/emoji-picker-element', express.static(path.join(__dirname, '../node_modules/emoji-picker-element')));

httpserver.listen(app.get('port'), () => {
    console.log('La aplicacion esta corriendo en el puerto: ', app.get('port'));
    logEvent({ accion: 'SERVIDOR_INICIADO', usuario: 'sistema', rol: 'sistema', origen: ORIGENES.M, detalle: { puerto: app.get('port') } });
});

realTimeServer(httpserver);
