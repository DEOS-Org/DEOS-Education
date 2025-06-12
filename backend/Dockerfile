# Dockerfile
FROM node:20

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Verificar la estructura de directorios después del build
RUN ls -la && ls -la dist/

# Comando para iniciar la aplicación
CMD ["node", "dist/app.js"]