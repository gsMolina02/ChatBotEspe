require('dotenv').config();
const  sentry = require('@sentry/node');
const pkg = require('../package.json');

sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'espechat@${pkg.version}',
    traceSampleRate: 0,
    sampleRate: 1.0,
    sendDefaultPii: false,
    enabled: Boolean(process.env.SENTRY_DSN),
    beforeSend(event){
        if(event.request?.cookies) delete event.request.cookies;
        if(event.request?.headers.cookies) delete event.request.headers.cookies;
        return event;
    }
});
