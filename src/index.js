const express = require('express');
const { createServer } = require('http');
const realTimeServer = require('./realTimeServer');
const path = require('path');

const app = express();
const httpserver = createServer(app);

app.set('port', process.env.PORT || 3000);
app.set('view', path.join(__dirname, 'views'));

app.use(require('./routes'));

app.use(express.static(path.join(__dirname,'public')));

httpserver.listen(app.get('port'), () => {
    console.log('La aplicacion esta corriendo en el pueto: ', app.get('port'));
});

realTimeServer(httpserver);