# Imagen mínima basada en Alpine: menos paquetes = menos superficie de ataque
FROM node:20-alpine

WORKDIR /app

# Instalar solo dependencias de producción (sin jest, nodemon, autocannon)
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Directorios escribibles (logs y fotos) asignados al usuario sin privilegios
RUN mkdir -p /app/logs /app/src/public/uploads \
    && chown -R node:node /app/logs /app/src/public/uploads

# Ejecutar como usuario 'node' (no root): un escape del proceso no da privilegios de administrador
USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_DIR=/app/logs

# Único puerto expuesto: el de la aplicación
EXPOSE 3000

# Verificación de salud del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/index.js"]
