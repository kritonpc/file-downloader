FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create downloads directory
RUN mkdir -p /app/downloads

# Set environment variables
ENV PORT=5000
ENV DOWNLOAD_DIR=/downloads
ENV NODE_ENV=production

# Expose the API port
EXPOSE 5000

# Run the application
CMD ["node", "server.js"]