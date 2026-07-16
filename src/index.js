require('./instrument');

const express = require('express');
const { createServer } = require('http');
const Sentry = require('@sentry/node');
const path = require('path');
const cookieParser = require('cookie-parser');
const realTimeServer = require('./realTimeServer');
const { globalLimiter } = require('./middleware/requestLimits');

const app = express();

const httpserver = createServer({
    maxHeaderSize: 8 * 1024,
    headersTimeout: 10 * 1000,
    requestTimeout: 15 * 1000,
    keepAliveTimeout: 5 * 1000,
    connectionsCheckingInterval: 1000,
    insecureHTTPParser: false,
    noDelay: true
}, app);

app.set('port', Number(process.env.PORT) || 3000);
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');
app.use(cookieParser());
app.use(globalLimiter);
app.use(require('./routes'));

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    fallthrough: true,
    dotfiles: 'deny'
}));

app.use('/emoji-picker-element', express.static(path.join(__dirname, '../node_modules/emoji-picker-element'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    fallthrough: false,
    dotfiles: 'deny'
}));

Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({
        success: false,
        error: 'Error interno del servidor.'
    });
});

httpserver.maxHeadersCount = 50;
httpserver.maxRequestsPerSocket = 100;

httpserver.on('clientError',(error,socket)=>{if(error.code==='ECONNRESET'||error.code==='EPIPE'){socket.destroy();return;}if(!socket.writable){socket.destroy();return;}if(error.code==='HPE_HEADER_OVERFLOW'){const body=JSON.stringify({success:false,error:'Cabeceras HTTP demasiado grandes.'});socket.end(`HTTP/1.1 431 Request Header Fields Too Large\r\nConnection: close\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);return;}if(String(error.code||'').startsWith('HPE_')){const body=JSON.stringify({success:false,error:'Solicitud HTTP inválida.'});socket.end(`HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);return;}socket.destroy();});

httpserver.on('connection', socket => {
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 1000);
    socket.setTimeout(20 * 1000);
    socket.on('timeout', () => socket.destroy());
    socket.on('error', () => socket.destroy());
});

realTimeServer(httpserver);

httpserver.listen(app.get('port'), '0.0.0.0', () => {
    console.log(`La aplicación está corriendo en el puerto ${app.get('port')}`);
});

function closeServer(signal) {
    console.log(`Cerrando servidor por ${signal}`);

    httpserver.close(() => {
        process.exit(0);
    });

    setTimeout(() => {
        process.exit(1);
    }, 10 * 1000).unref();
}

process.on('SIGTERM', () => closeServer('SIGTERM'));
process.on('SIGINT', () => closeServer('SIGINT'));