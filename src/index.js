require('./instrument');
const express = require('express');
const { createServer } = require('http');
const Sentry = require('@sentry/node');
const realTimeServer = require('./realTimeServer');
const { logEvent, ORIGENES } = require('./services/loggerService');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { Buffer } = require('buffer');

const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
app.disable('x-powered-by');

const httpserver = createServer(app);

/* ── Límites nativos de Node.js (http.Server) contra negación de servicio ──
   Reactivos que Node permite configurar en el servidor HTTP: */
httpserver.maxConnections = 200;        // conexiones TCP simultáneas como máximo
httpserver.headersTimeout = 10000;      // 10 s para enviar las cabeceras completas (corta ataques Slowloris)
httpserver.requestTimeout = 30000;      // 30 s para completar la petición entera
httpserver.keepAliveTimeout = 5000;     // 5 s de gracia en conexiones keep-alive ociosas
httpserver.maxRequestsPerSocket = 100;  // peticiones máximas reutilizando una misma conexión

// Detrás del proxy de Render: confiar en X-Forwarded-For para obtener la IP real del cliente
app.set('trust proxy', 1);
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());

/* ── Rate limiting global: 100 solicitudes por minuto por IP ──
   Complementa al loginLimiter (que es más estricto y solo cubre /login) */
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logEvent({
            accion: 'SOLICITUDES_BLOQUEADAS',
            usuario: (req.cookies && req.cookies.username) || 'anonimo',
            rol: 'anonimo',
            origen: ORIGENES.MS,
            detalle: { ip: req.ip, ruta: req.originalUrl, criterio: '100 solicitudes por minuto' }
        });
        res.status(429).send('Demasiadas solicitudes. Inténtalo de nuevo en un minuto.');
    }
});
app.use(globalLimiter);
// Middleware: eliminar headers que delatan el framework/plataforma
app.use((_req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.removeHeader('ETag');
    res.setHeader('Server', 'webserver');
    next();
});
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

// Descargar y limpiar el bundle de Sentry al iniciar el servidor (solo una vez)
let cleanSentryBundle = '';
https.get('https://browser.sentry-cdn.com/10.66.0/bundle.min.js', (cdnRes) => {
    const chunks = [];
    cdnRes.on('data', (chunk) => chunks.push(chunk));
    cdnRes.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        // Eliminar bloque de comentario con licencia/versión y referencias a la versión dentro del código
        cleanSentryBundle = raw
            .replace(/\/\*[\s\S]*?\*\//, '')                     // comentario de cabecera
            .replace(/["']\d+\.\d+\.\d+["']/g, '"0.0.0"')       // versiones como "10.66.0"
            .replace(/version:\s*["']\d+\.\d+\.\d+["']/g, 'version:"0.0.0"'); // version: "x.y.z"
    });
}).on('error', (err) => {
    console.error('Error al descargar Sentry SDK:', err);
});

app.get('/js/mon.js', (req, res) => {
    res.type('application/javascript');
    res.send(cleanSentryBundle || '// not ready');
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
