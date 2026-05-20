FROM node:18-alpine

WORKDIR /app

# Copiamos los archivos de configuración de dependencias
COPY package*.json ./

# Instalamos las dependencias dentro del contenedor
RUN npm install

# Copiamos absolutamente todo el proyecto adentro de /app
COPY . .

EXPOSE 3000

# CORRECCIÓN: Le decimos a Node que ejecute el archivo que está en la raíz, que es app.js
CMD ["node", "src/app.js"]