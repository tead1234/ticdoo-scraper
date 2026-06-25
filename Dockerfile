FROM node:22

WORKDIR /app
COPY package*.json ./
RUN npm ci && npx playwright install --with-deps chromium

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
