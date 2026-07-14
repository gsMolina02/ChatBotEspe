const fs = require('fs');
const path = require('path');

// Ruta de logs: LOG_DIR > C:/Temp/App/Core (Windows) > ./logs (Linux/Render)
const LOG_DIR = process.env.LOG_DIR ||
    (process.platform === 'win32' ? 'C:/Temp/App/Core' : path.join(process.cwd(), 'logs'));

// Orígenes válidos del evento
const ORIGENES = {
    WS: 'WS',           // WebSocket (Socket.IO)
    MS: 'MS',           // Servicio web REST/HTTP
    M: 'M',             // Módulo interno (arranque, procesos del sistema)
    PORTAFOLIO: 'Portafolio'
};

function logEvent({ accion, usuario = 'anonimo', rol = 'estudiante', origen = ORIGENES.MS, detalle = {} }) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });

        const now = new Date();
        const fecha = now.toISOString().slice(0, 10); // yyyy-mm-dd

        const entry = {
            fecha,
            hora: now.toLocaleTimeString('es-EC', { hour12: false }),
            timestamp: now.toISOString(),
            accion,
            quien: { usuario, rol },
            deDonde: origen,
            detalle
        };

        const file = path.join(LOG_DIR, `espechat-${fecha}.log`);
        fs.appendFile(file, JSON.stringify(entry) + '\n', () => {});
    } catch (err) {
        // El logging nunca debe tumbar la aplicación
        console.error('No se pudo escribir el log:', err.message);
    }
}

module.exports = { logEvent, ORIGENES, LOG_DIR };
