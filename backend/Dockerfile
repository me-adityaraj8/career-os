# Backend Dockerfile — development-oriented (uses tsx watch via docker-compose command).
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Uploads directory for resume PDFs (also mounted as a volume in compose)
RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["npm", "run", "dev"]
