const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
    initializeApp({
        credential: cert({
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/"/g, '').replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
        })
    });
}

module.exports = getFirestore();
