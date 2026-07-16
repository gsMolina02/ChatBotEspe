function createSocketRateLimiter({ points, durationMs, blockDurationMs = durationMs, keyGenerator = socket => socket.id }) {
    const records = new Map();

    const cleanupTimer = setInterval(() => {
        const now = Date.now();

        for (const [key, record] of records.entries()) {
            if (now >= record.expiresAt && now >= record.blockedUntil) {
                records.delete(key);
            }
        }
    }, Math.max(durationMs, 30000));

    cleanupTimer.unref();

    function consume(socket, eventName) {
        const key = keyGenerator(socket);
        const now = Date.now();
        let record = records.get(key);

        if (!record) {
            record = {
                count: 0,
                expiresAt: now + durationMs,
                blockedUntil: 0
            };

            records.set(key, record);
        }

        if (record.blockedUntil > now) {
            socket.emit('rateLimitError', {
                event: eventName,
                retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
                message: 'Demasiados eventos. Espera antes de continuar.'
            });

            return false;
        }

        if (now >= record.expiresAt) {
            record.count = 0;
            record.expiresAt = now + durationMs;
            record.blockedUntil = 0;
        }

        record.count += 1;

        if (record.count > points) {
            record.blockedUntil = now + blockDurationMs;

            socket.emit('rateLimitError', {
                event: eventName,
                retryAfter: Math.ceil(blockDurationMs / 1000),
                message: 'Se superó el límite de eventos permitido.'
            });

            return false;
        }

        return true;
    }

    function remove(socket) {
        records.delete(keyGenerator(socket));
    }

    return {
        consume,
        remove
    };
}

module.exports = {
    createSocketRateLimiter
};