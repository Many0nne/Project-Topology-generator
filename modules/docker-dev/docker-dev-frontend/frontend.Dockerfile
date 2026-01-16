FROM node:24
WORKDIR /app
COPY package*.json ./
# Ensure devDependencies (vite) are installed in dev image
RUN npm install --include=dev
COPY . .
CMD ["npm", "run", "dev"]
