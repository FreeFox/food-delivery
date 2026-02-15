FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run start:dev

CMD ["npm", "run", "start:prod"]
