# Official Playwright base image with pre-installed browser binaries and system dependencies
FROM mcr.microsoft.com/playwright:v1.43.0-jammy

# Set working directory inside container
WORKDIR /app

# Copy package manifests and install node dependencies
COPY package*.json ./
RUN npm ci

# Copy project source code
COPY . .

# Expose Executive Dashboard Port
EXPOSE 8090

# Set default environment variables
ENV PORT=8090
ENV HEADLESS=true

# Command to launch the Executive Dashboard server
CMD ["npm", "run", "dashboard"]
