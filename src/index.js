require('./instrument');
const express = require('express');
const { createServer } = require('http');
const Sentry = require('@sentry/node');
const realTimeServer = require('./realTimeServer');
const path = require('path');

const cookieParser = require('cookie-parser');

const app = express();
const httpserver = createServer(app);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
app.use(require('./routes'));

Sentry.setupExpressErrorHandler(app);

app.use(express.static(path.join(__dirname,'public')));
app.use('/emoji-picker-element', express.static(path.join(__dirname, '../node_modules/emoji-picker-element')));

httpserver.listen(app.get('port'), () => {
    console.log('La aplicacion esta corriendo en el puerto: ', app.get('port'));
});

realTimeServer(httpserver);
