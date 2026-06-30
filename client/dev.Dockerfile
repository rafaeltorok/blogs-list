FROM node:24-alpine

WORKDIR /usr/src/app/client

# Install curl for the healthcheck
RUN apk add --no-cache curl

# Install dependencies
COPY --chown=node:node ./package*.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 5173

USER node

CMD ["npm", "run", "dev"]
