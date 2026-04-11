FROM node:22-slim

RUN apt-get update -y \
    && apt-get install -y openssl gosu psmisc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN npx prisma generate

RUN npm install -g nodemon

# Start with the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["npm", "run", "start:debug"]
