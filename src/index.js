const express = require('express');
const { createServer } = require('http');
const realTimeServer = require('./realTimeServer');
const path = require('path');
const fs = require('fs');

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
app.use(require('./routes'));

app.use(express.static(path.join(__dirname,'public')));
app.use('/emoji-picker-element', express.static(path.join(__dirname, '../node_modules/emoji-picker-element')));

httpserver.listen(app.get('port'), () => {
    console.log('La aplicacion esta corriendo en el puerto: ', app.get('port'));
});

realTimeServer(httpserver);
