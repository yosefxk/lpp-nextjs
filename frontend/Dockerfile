FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Build the project
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_APP_TITLE
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_APP_TITLE=$NEXT_PUBLIC_APP_TITLE
RUN npm run build

# Next.js production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Start the server
CMD ["npm", "start"]
